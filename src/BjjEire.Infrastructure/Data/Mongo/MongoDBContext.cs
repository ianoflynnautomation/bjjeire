// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


using BjjEire.Application.Common;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities;

using Microsoft.Extensions.Logging;

namespace BjjEire.Infrastructure.Data.Mongo;

public class MongoDBContext(IMongoDatabase mongodatabase, ILogger<MongoDBContext> logger) : IDatabaseContext
{
    private readonly IMongoDatabase _database = mongodatabase;
    private readonly ILogger<MongoDBContext> _logger = logger;

    public async Task<bool> DatabaseExistAsync()
    {
        BsonDocument filter = new("name", "BjjWorldVersion");
        IAsyncCursor<BsonDocument> found = await _database.ListCollectionsAsync(new ListCollectionsOptions { Filter = filter });
        return await found.AnyAsync();
    }

    public async Task CreateCollectionAsync(string name, string collation)
    {
        ArgumentException.ThrowIfNullOrEmpty(name);

        if (!string.IsNullOrEmpty(collation))
        {
            CreateCollectionOptions options = new()
            {
                Collation = new Collation(collation)
            };
            await _database.CreateCollectionAsync(name, options);
        }
        else
        {
            await _database.CreateCollectionAsync(name);
        }
    }

    public async Task DeleteCollectionAsync(string name)
    {
        ArgumentNullException.ThrowIfNullOrEmpty(name);
        await _database.DropCollectionAsync(name);
    }

    public async Task CreateIndexAsync<T>(IRepository<T> repository, OrderBuilder<T> orderBuilder, string indexName,
        bool unique = false) where T : BaseEntity
    {
        ArgumentNullException.ThrowIfNullOrEmpty(indexName);
        ArgumentNullException.ThrowIfNull(orderBuilder);

        IList<IndexKeysDefinition<T>> keys = [];
        foreach ((Expression<Func<T, object>>? selector, bool value, string? fieldName) in orderBuilder.Fields)
        {
            if (selector != null)
            {
                keys.Add(value
                    ? Builders<T>.IndexKeys.Ascending(selector)
                    : Builders<T>.IndexKeys.Descending(selector));
            }
            else
            {
                keys.Add(value
                    ? Builders<T>.IndexKeys.Ascending(fieldName)
                    : Builders<T>.IndexKeys.Descending(fieldName));
            }
        }

        try
        {
            ArgumentNullException.ThrowIfNull(repository);
            _ = await ((MongoRepository<T>)repository).Collection.Indexes.CreateOneAsync(new CreateIndexModel<T>(
                Builders<T>.IndexKeys.Combine(keys),
                new CreateIndexOptions { Name = indexName, Unique = unique }));
        }
        catch (InvalidCastException ex)
        {
            MongoDBContextLog.InvalidRepositoryTypeForIndex(_logger, ex, indexName, typeof(T).Name);
            throw new InvalidOperationException($"Repository for {typeof(T).Name} is not a MongoRepository.", ex);
        }
    }

    public async Task DeleteIndexAsync<T>(IRepository<T> repository, string indexName) where T : BaseEntity
    {
        ArgumentNullException.ThrowIfNullOrEmpty(indexName);
        try
        {
            ArgumentNullException.ThrowIfNull(repository);
            await ((MongoRepository<T>)repository).Collection.Indexes.DropOneAsync(indexName);
        }
        catch (MongoException ex)
        {
            MongoDBContextLog.IndexDeleteFailed(_logger, ex, indexName, typeof(T).Name);
            throw new InvalidOperationException($"Repository for {typeof(T).Name} is not a MongoRepository.", ex);
        }
    }
}
