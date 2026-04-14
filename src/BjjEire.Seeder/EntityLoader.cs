using System.Text.Json;
using System.Text.Json.Serialization;

using BjjEire.Domain.Entities;

namespace BjjEire.Seeder;

internal static class EntityLoader
{
    public static readonly JsonSerializerOptions PermissiveOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters =
        {
            new JsonStringEnumConverter(),
            new TimeSpanJsonConverter(),
        },
    };

    public static readonly JsonSerializerOptions StrictOptions = new()
    {
        PropertyNameCaseInsensitive = false,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
        Converters =
        {
            new JsonStringEnumConverter(),
            new TimeSpanJsonConverter(),
        },
    };

    public static async Task<(List<T>? entities, string? error)> LoadAsync<T>(string jsonPath, JsonSerializerOptions options)
        where T : BaseEntity
    {
        if (!File.Exists(jsonPath))
            return (null, $"File not found: {jsonPath}");

        try
        {
            var json = await File.ReadAllTextAsync(jsonPath);
            var entities = JsonSerializer.Deserialize<List<T>>(json, options);
            return (entities, null);
        }
        catch (Exception ex)
        {
            return (null, ex.Message);
        }
    }

    public static async Task<string?> ValidateAsync(Type entityType, string jsonPath, JsonSerializerOptions options)
    {
        if (!File.Exists(jsonPath))
            return $"File not found: {jsonPath}";

        try
        {
            var json = await File.ReadAllTextAsync(jsonPath);
            var listType = typeof(List<>).MakeGenericType(entityType);
            _ = JsonSerializer.Deserialize(json, listType, options);
            return null;
        }
        catch (Exception ex)
        {
            return ex.Message;
        }
    }
}
