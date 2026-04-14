using System.Text.Json;

using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Entities.Competitions;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Entities.Stores;

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
            },
            SchemaType = SchemaType.JsonSchema,
            FlattenInheritanceHierarchy = true,
        };

        foreach (var (name, type) in Targets)
        {
            var schema = JsonSchema.FromType(type, settings);
            schema.Title = type.Name;

            var arraySchema = new JsonSchema
            {
                Type = JsonObjectType.Array,
                Item = schema,
                Title = $"{type.Name}[]",
                Description = $"Array of {type.Name} entities. One PR = one new item appended, or one file in the per-entity directory.",
            };

            var outputPath = Path.Combine(outputDir, $"{name}.schema.json");
            await File.WriteAllTextAsync(outputPath, arraySchema.ToJson());
            Console.WriteLine($"  Wrote {outputPath}");
        }

        return 0;
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
