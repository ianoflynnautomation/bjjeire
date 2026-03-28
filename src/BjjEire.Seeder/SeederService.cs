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

    public async Task<int> SeedAsync<T>(string collectionName, string jsonPath) where T : BaseEntity
    {
        await Console.Out.WriteLineAsync($"\n── {collectionName} ({jsonPath}) ──");

        var entities = await LoadEntitiesAsync<T>(jsonPath);
        if (entities is null)
            return 1;
        if (entities.Count == 0)
        {
            await Console.Out.WriteLineAsync("  No documents found — skipping.");
            return 0;
        }

        var collection = db.GetCollection<T>(collectionName);

        if (dryRun)
        {
            await PreviewAsync(collection, entities);
            return 0;
        }

        return await BulkUpsertAsync(collection, entities);
    }

    private static async Task PreviewAsync<T>(IMongoCollection<T> collection, List<T> entities)
        where T : BaseEntity
    {
        var ids = entities.Select(e => e.Id).ToList();
        var existingIds = (await collection
            .Find(Builders<T>.Filter.In(e => e.Id, ids))
            .Project(Builders<T>.Projection.Expression(e => e.Id))
            .ToListAsync())
            .ToHashSet();

        foreach (var entity in entities)
        {
            Console.WriteLine(existingIds.Contains(entity.Id)
                ? $"  [DRY RUN]  {entity.Id} — would replace"
                : $"  [DRY RUN]  {entity.Id} — would insert");
        }

        var wouldInsert = entities.Count - existingIds.Count;
        await Console.Out.WriteLineAsync($"  Preview: {wouldInsert} would insert, {existingIds.Count} would replace.");
    }

    private static async Task<int> BulkUpsertAsync<T>(IMongoCollection<T> collection, List<T> entities)
        where T : BaseEntity
    {
        var requests = entities
            .Select(e => (WriteModel<T>)new ReplaceOneModel<T>(
                Builders<T>.Filter.Eq(x => x.Id, e.Id), e)
            { IsUpsert = true })
            .ToList();

        try
        {
            var result = await collection.BulkWriteAsync(requests, new BulkWriteOptions { IsOrdered = false });
            await Console.Out.WriteLineAsync(
                $"  Result: {result.Upserts.Count} inserted, {result.ModifiedCount} replaced, 0 failed.");
            return 0;
        }
        catch (MongoBulkWriteException<T> ex)
        {
            foreach (var error in ex.WriteErrors)
                await Console.Error.WriteLineAsync($"  FAILED [{error.Index}]: {error.Message}");
            await Console.Out.WriteLineAsync(
                $"  Result: {ex.Result.Upserts.Count} inserted, {ex.Result.ModifiedCount} replaced, {ex.WriteErrors.Count} failed.");
            return 1;
        }
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
}
