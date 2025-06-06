// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Shouldly;

namespace BjjEire.Api.IntegrationTests.Services;

public class TestDatabaseService(IServiceScopeFactory scopeFactory, ILogger<TestDatabaseService> logger)
    : ITestDatabaseService
{
    public async Task ClearCollectionsAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();
        logger.LogInformation("Clearing all collections from database: {DatabaseName}", database.DatabaseNamespace.DatabaseName);

        var collectionNames = await (await database.ListCollectionNamesAsync()).ToListAsync();
        foreach (var collectionName in collectionNames)
        {
            await database.DropCollectionAsync(collectionName);
        }
        logger.LogInformation("All collections cleared.");
    }

    public async Task SeedEntitiesAsync<TEntity>(params TEntity[] entities) where TEntity : BaseEntity
    {
        using var scope = scopeFactory.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();
        var collectionName = typeof(TEntity).Name;
        logger.LogInformation("Seeding {Count} entities into collection {CollectionName}", entities.Length, collectionName);

        if (entities.Length == 0) return;

        var collection = database.GetCollection<TEntity>(collectionName);
        await collection.InsertManyAsync(entities);

        var seededCount = await collection.CountDocumentsAsync(_ => true);
        seededCount.ShouldBe(entities.Length);
        logger.LogInformation("Seeded {SeededCount} entities successfully.", seededCount);
    }
}
