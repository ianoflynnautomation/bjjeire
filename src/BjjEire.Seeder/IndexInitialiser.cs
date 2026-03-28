using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Entities.Gyms;

namespace BjjEire.Seeder;

internal static class IndexInitialiser
{
    internal static async Task EnsureIndexesAsync(IMongoDatabase db)
    {
        await EnsureGymIndexesAsync(db);
        await EnsureEventIndexesAsync(db);
        await Console.Out.WriteLineAsync("── Indexes ensured ──");
    }

    private static async Task EnsureGymIndexesAsync(IMongoDatabase db)
    {
        var collection = db.GetCollection<Gym>("Gym");
        _ = await collection.Indexes.CreateManyAsync(
        [
            new CreateIndexModel<Gym>(
                Builders<Gym>.IndexKeys.Ascending(g => g.County),
                new CreateIndexOptions { Name = "idx_gym_county" }),
            new CreateIndexModel<Gym>(
                Builders<Gym>.IndexKeys.Ascending(g => g.Status),
                new CreateIndexOptions { Name = "idx_gym_status" }),
            new CreateIndexModel<Gym>(
                Builders<Gym>.IndexKeys.Geo2DSphere("location.coordinates"),
                new CreateIndexOptions { Name = "idx_gym_location_geo" }),
        ]);
    }

    private static async Task EnsureEventIndexesAsync(IMongoDatabase db)
    {
        var collection = db.GetCollection<BjjEvent>("BjjEvent");
        _ = await collection.Indexes.CreateManyAsync(
        [
            new CreateIndexModel<BjjEvent>(
                Builders<BjjEvent>.IndexKeys.Ascending(e => e.County),
                new CreateIndexOptions { Name = "idx_event_county" }),
            new CreateIndexModel<BjjEvent>(
                Builders<BjjEvent>.IndexKeys.Ascending(e => e.Status),
                new CreateIndexOptions { Name = "idx_event_status" }),
            new CreateIndexModel<BjjEvent>(
                Builders<BjjEvent>.IndexKeys.Ascending(e => e.Type),
                new CreateIndexOptions { Name = "idx_event_type" }),
            new CreateIndexModel<BjjEvent>(
                Builders<BjjEvent>.IndexKeys.Ascending("schedule.startDate"),
                new CreateIndexOptions { Name = "idx_event_startdate" }),
            new CreateIndexModel<BjjEvent>(
                Builders<BjjEvent>.IndexKeys.Geo2DSphere("location.coordinates"),
                new CreateIndexOptions { Name = "idx_event_location_geo" }),
        ]);
    }
}
