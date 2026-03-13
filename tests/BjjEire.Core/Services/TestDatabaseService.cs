// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Core.Interfaces;
using BjjEire.Domain.Entities;

using Microsoft.Extensions.Logging;

using MongoDB.Driver;

namespace BjjEire.Core.Services;

public class TestDatabaseService(IMongoDatabase database, ILogger<TestDatabaseService> logger)
    : ITestDatabaseService
{
    public async Task ClearCollectionsAsync()
    {
        logger.LogDebug("Clearing all collections from database: {DatabaseName}", database.DatabaseNamespace.DatabaseName);
        var collectionNames = await (await database.ListCollectionNamesAsync().ConfigureAwait(false)).ToListAsync().ConfigureAwait(false);
        foreach (var collectionName in collectionNames)
        {
            await database.DropCollectionAsync(collectionName).ConfigureAwait(false);
        }
    }

    public async Task SeedEntitiesAsync<TEntity>(params TEntity[] entities) where TEntity : BaseEntity
    {

        if (entities == null || entities.Length == 0)
        {
            return;
        }

        var collectionName = typeof(TEntity).Name;
        logger.LogInformation("Seeding {Count} entities into collection {CollectionName}", entities.Length, collectionName);
        var collection = database.GetCollection<TEntity>(collectionName);
        await collection.InsertManyAsync(entities).ConfigureAwait(false);
        // var seededCount = await collection.CountDocumentsAsync(_ => true); // use for debugging.
        // seededCount.ShouldBe(entities.Length);
    }
}
