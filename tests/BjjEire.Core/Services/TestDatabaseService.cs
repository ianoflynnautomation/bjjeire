// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Core.Interfaces;
using BjjEire.Domain.Entities;

using Microsoft.Extensions.Logging;

using MongoDB.Bson;
using MongoDB.Driver;

namespace BjjEire.Core.Services;

public class TestDatabaseService(IMongoDatabase database, ILogger<TestDatabaseService> logger)
    : ITestDatabaseService
{
    // Empty filter matches every document; DeleteMany preserves collection-level
    // indexes (geo, text, compound) that DropCollection would destroy.
    private static readonly FilterDefinition<BsonDocument> MatchAll = Builders<BsonDocument>.Filter.Empty;

    public async Task ClearCollectionsAsync()
    {
        logger.LogDebug("Clearing documents from all collections in database: {DatabaseName}", database.DatabaseNamespace.DatabaseName);
        List<string> collectionNames = await (await database.ListCollectionNamesAsync().ConfigureAwait(false)).ToListAsync().ConfigureAwait(false);
        foreach (string? collectionName in collectionNames)
        {
            IMongoCollection<BsonDocument> collection = database.GetCollection<BsonDocument>(collectionName);
            _ = await collection.DeleteManyAsync(MatchAll).ConfigureAwait(false);
        }
    }

    public async Task SeedEntitiesAsync<TEntity>(params TEntity[] entities) where TEntity : BaseEntity
    {

        if (entities == null || entities.Length == 0)
        {
            return;
        }

        string collectionName = typeof(TEntity).Name;
        logger.LogInformation("Seeding {Count} entities into collection {CollectionName}", entities.Length, collectionName);
        IMongoCollection<TEntity> collection = database.GetCollection<TEntity>(collectionName);
        await collection.InsertManyAsync(entities).ConfigureAwait(false);
        // var seededCount = await collection.CountDocumentsAsync(_ => true); // use for debugging.
        // seededCount.ShouldBe(entities.Length);
    }
}
