// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Shouldly;

namespace BjjEire.Api.IntegrationTests;
public static class DatabaseHelper
{
    public static async Task ResetDatabaseAsync(IServiceProvider services, ILogger logger)
    {
        var database = services.GetRequiredService<IMongoDatabase>();
        var databaseName = database.DatabaseNamespace.DatabaseName;
        logger.LogInformation(TestLoggingEvents.TestLifecycle.DatabaseResetting, "Dropping database '{DbName}'...", databaseName);

        await database.Client.DropDatabaseAsync(databaseName);
        logger.LogInformation(TestLoggingEvents.TestLifecycle.DatabaseResetComplete, "Database '{DbName}' dropped.", databaseName);
    }

    public static async Task SeedEntitiesAsync<TEntity>(IServiceProvider services, ILogger logger, params TEntity[] entities) where TEntity : BaseEntity
    {
        if (entities.Length == 0)
        {
            logger.LogInformation(TestLoggingEvents.TestLifecycle.SeedingData, "No entities provided for seeding for type {EntityType}", typeof(TEntity).Name);
            return;
        }

        var dbContext = services.GetRequiredService<IMongoDatabase>();
        var collectionName = typeof(TEntity).Name;
        var collection = dbContext.GetCollection<TEntity>(collectionName);

        logger.LogInformation(TestLoggingEvents.TestLifecycle.SeedingData, "Seeding {EntityCount} entities into collection {CollectionName}", entities.Length, collectionName);
        await collection.InsertManyAsync(entities);

        var countAfterInsert = await collection.CountDocumentsAsync(FilterDefinition<TEntity>.Empty);
        countAfterInsert.ShouldBe(entities.Length, $"Collection {collectionName} should have {entities.Length} documents after seeding.");
        logger.LogInformation(TestLoggingEvents.TestLifecycle.SeedingData, "Completed seeding {EntityCount} entities into collection {CollectionName}", entities.Length, collectionName);
    }
}
