using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Entities.Competitions;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Entities.Stores;

using MongoDB.Bson.Serialization.Attributes;

using NJsonSchema;
using NJsonSchema.Generation;

namespace BjjEire.Seeder;

internal static class SchemaGenerator
{
    private static readonly (string name, Type type)[] Targets =
    [
        ("gym", typeof(Gym)),
        ("bjj-event", typeof(BjjEvent)),
        ("competition", typeof(Competition)),
        ("store", typeof(Store)),
    ];

    internal static async Task<int> GenerateAsync(string outputDir)
    {
        // Resolve relative to the seeder project source dir so `dotnet run --generate-schemas`
        // always writes to src/BjjEire.Seeder/data/schemas regardless of cwd.
        if (!Path.IsPathRooted(outputDir))
        {
            var projectRoot = FindProjectRoot();
            outputDir = Path.Combine(projectRoot, outputDir);
        }

        _ = Directory.CreateDirectory(outputDir);

        var settings = new SystemTextJsonSchemaGeneratorSettings
        {
            SerializerOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                Converters = { new JsonStringEnumConverter() },
            },
            SchemaType = SchemaType.JsonSchema,
            FlattenInheritanceHierarchy = true,
        };

        foreach (var (name, type) in Targets)
        {
            var schema = JsonSchema.FromType(type, settings);
            schema.Title = type.Name;
            ApplyBsonElementNames(schema, type);

            var arraySchema = new JsonSchema
            {
                Type = JsonObjectType.Array,
                Item = schema,
                Title = $"{type.Name}[]",
                Description = $"Array of {type.Name} entities. One PR = one new item appended, or one file in the per-entity directory.",
            };

            var outputPath = Path.Combine(outputDir, $"{name}.schema.json");
            var json = arraySchema.ToJson()
                .Replace("\"http://json-schema.org/draft-04/schema#\"", "\"http://json-schema.org/draft-07/schema#\"", StringComparison.Ordinal);
            await File.WriteAllTextAsync(outputPath, json);
            Console.WriteLine($"  Wrote {outputPath}");
        }

        return 0;
    }

    private static void ApplyBsonElementNames(JsonSchema schema, Type type)
    {
        var visited = new HashSet<JsonSchema>();
        Walk(schema, type);

        void Walk(JsonSchema node, Type? clrType)
        {
            if (!visited.Add(node))
                return;

            if (clrType is not null && node.Properties.Count > 0)
            {
                var clrProps = clrType
                    .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                    .ToDictionary(p => JsonNamingPolicy.CamelCase.ConvertName(p.Name), p => p, StringComparer.Ordinal);

                foreach (var schemaName in node.Properties.Keys.ToList())
                {
                    if (!clrProps.TryGetValue(schemaName, out var prop))
                        continue;

                    var bson = prop.GetCustomAttribute<BsonElementAttribute>();
                    if (bson is null || string.Equals(bson.ElementName, schemaName, StringComparison.Ordinal))
                        continue;

                    var propSchema = node.Properties[schemaName];
                    _ = node.Properties.Remove(schemaName);
                    node.Properties[bson.ElementName] = propSchema;

                    if (node.RequiredProperties.Remove(schemaName))
                    {
                        node.RequiredProperties.Add(bson.ElementName);
                    }
                }
            }

            foreach (var (schemaName, propSchema) in node.Properties)
            {
                var nextType = clrType?
                    .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                    .FirstOrDefault(p => JsonNamingPolicy.CamelCase.ConvertName(p.Name) == schemaName
                                         || (p.GetCustomAttribute<BsonElementAttribute>()?.ElementName == schemaName))?
                    .PropertyType;

                var elementType = UnwrapEnumerable(nextType);
                Walk(propSchema.ActualSchema, elementType ?? nextType);
            }

            if (node.Item is not null)
            {
                var elementType = UnwrapEnumerable(clrType);
                Walk(node.Item.ActualSchema, elementType);
            }

            foreach (var def in node.Definitions.Values)
                Walk(def.ActualSchema, null);
        }

        static Type? UnwrapEnumerable(Type? t)
        {
            if (t is null)
                return null;
            if (t.IsArray)
                return t.GetElementType();
            if (t.IsGenericType)
            {
                var gen = t.GetGenericTypeDefinition();
                if (gen == typeof(List<>) || gen == typeof(IEnumerable<>) || gen == typeof(ICollection<>) || gen == typeof(IList<>) || gen == typeof(IReadOnlyList<>) || gen == typeof(IReadOnlyCollection<>))
                    return t.GetGenericArguments()[0];
            }
            return null;
        }
    }

    private static string FindProjectRoot()
    {
        // Walk up from AppContext.BaseDirectory (bin output) until we find BjjEire.Seeder.csproj.
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "BjjEire.Seeder.csproj")))
            dir = dir.Parent;

        return dir?.FullName ?? Directory.GetCurrentDirectory();
    }
}
