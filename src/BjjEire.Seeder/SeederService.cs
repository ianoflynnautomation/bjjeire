using System.Text.Json;
using System.Text.Json.Serialization;
using BjjEire.Domain.Entities;

namespace BjjEire.Seeder;

public class SeederService(IMongoDatabase db, bool dryRun)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters =
        {
            new JsonStringEnumConverter(),
            new TimeSpanJsonConverter(),
        },
    };

    private enum UpsertOutcome { Inserted, Replaced, DryRunInsert, DryRunReplace, Failed }


    public async Task<int> SeedAsync<T>(string collectionName, string jsonPath) where T : BaseEntity
    {
        await Console.Out.WriteLineAsync($"\n── {collectionName} ({jsonPath}) ──");

        var entities = await LoadEntitiesAsync<T>(jsonPath);
        if (entities is null) return 1;
        if (entities.Count == 0)
        {
            await Console.Out.WriteLineAsync("  No documents found — skipping.");
            return 0;
        }

        var collection = db.GetCollection<T>(collectionName);
        var counts = await UpsertAllAsync(collection, entities);

        await Console.Out.WriteLineAsync($"  Result: {counts.inserted} inserted, {counts.replaced} replaced, {counts.failed} failed.");
        return counts.failed > 0 ? 1 : 0;
    }

    private static async Task<List<T>?> LoadEntitiesAsync<T>(string jsonPath) where T : BaseEntity
    {
        if (!File.Exists(jsonPath))
        {
            await Console.Error.WriteLineAsync($"  ERROR: File not found: {jsonPath}");
            return null;
        }

        try
        {
            var json = await File.ReadAllTextAsync(jsonPath);
            return JsonSerializer.Deserialize<List<T>>(json, JsonOptions);
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync($"  ERROR: Failed to deserialize {jsonPath}: {ex.Message}");
            return null;
        }
    }

    private async Task<(int inserted, int replaced, int failed)> UpsertAllAsync<T>(
        IMongoCollection<T> collection, List<T> entities) where T : BaseEntity
    {
        var inserted = 0;
        var replaced = 0;
        var failed = 0;

        foreach (var entity in entities)
        {
            var (outcome, error) = await UpsertOneAsync(collection, entity);
            LogOutcome(entity.Id, outcome, error);

            switch (outcome)
            {
                case UpsertOutcome.Inserted:    inserted++; break;
                case UpsertOutcome.Replaced:    replaced++; break;
                case UpsertOutcome.Failed:      failed++;   break;
            }
        }

        return (inserted, replaced, failed);
    }

    private async Task<(UpsertOutcome outcome, string? error)> UpsertOneAsync<T>(
        IMongoCollection<T> collection, T entity) where T : BaseEntity
    {
        var filter = Builders<T>.Filter.Eq(e => e.Id, entity.Id);

        try
        {
            if (dryRun)
            {
                var exists = await collection.CountDocumentsAsync(filter) > 0;
                return (exists ? UpsertOutcome.DryRunReplace : UpsertOutcome.DryRunInsert, null);
            }

            var result = await collection.ReplaceOneAsync(filter, entity, new ReplaceOptions { IsUpsert = true });
            return result.UpsertedId is not null
                ? (UpsertOutcome.Inserted, null)
                : (UpsertOutcome.Replaced, null);
        }
        catch (Exception ex)
        {
            return (UpsertOutcome.Failed, ex.Message);
        }
    }

    private static void LogOutcome(string id, UpsertOutcome outcome, string? error) =>
        Console.WriteLine(outcome switch
        {
            UpsertOutcome.Inserted      => $"  INSERTED      {id}",
            UpsertOutcome.Replaced      => $"  REPLACED      {id}",
            UpsertOutcome.DryRunInsert  => $"  [DRY RUN]     {id} — would insert",
            UpsertOutcome.DryRunReplace => $"  [DRY RUN]     {id} — would replace",
            UpsertOutcome.Failed        => $"  FAILED        {id} — {error}",
            _                           => $"  UNKNOWN       {id}",
        });
}
