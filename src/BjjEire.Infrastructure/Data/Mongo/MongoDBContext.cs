
using BjjEire.Application.Common;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities;

namespace BjjEire.Infrastructure.Data.Mongo;

public class MongoDBContext(IMongoDatabase mongodatabase) : IDatabaseContext
{
    private readonly IMongoDatabase _database = mongodatabase;

    public async Task<bool> DatabaseExist()
    {
        var filter = new BsonDocument("name", "BjjWorldVersion");
        var found = await _database.ListCollectionsAsync(new ListCollectionsOptions { Filter = filter });
        return await found.AnyAsync();
    }

    public async Task CreateCollection(string name, string collation)
    {
        ArgumentException.ThrowIfNullOrEmpty(name);

        if (!string.IsNullOrEmpty(collation))
        {
            var options = new CreateCollectionOptions
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

    public async Task DeleteCollection(string name)
    {
        ArgumentNullException.ThrowIfNullOrEmpty(name);
        await _database.DropCollectionAsync(name);
    }

    public async Task CreateIndex<T>(IRepository<T> repository, OrderBuilder<T> orderBuilder, string indexName,
        bool unique = false) where T : BaseEntity
    {
        ArgumentNullException.ThrowIfNullOrEmpty(indexName);
        ArgumentNullException.ThrowIfNull(orderBuilder);

        IList<IndexKeysDefinition<T>> keys = [];
        foreach (var (selector, value, fieldName) in orderBuilder.Fields)
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
        catch { }
    }

    public async Task DeleteIndex<T>(IRepository<T> repository, string indexName) where T : BaseEntity
    {
        ArgumentNullException.ThrowIfNullOrEmpty(indexName);
        try
        {
            ArgumentNullException.ThrowIfNull(repository);
            await ((MongoRepository<T>)repository).Collection.Indexes.DropOneAsync(indexName);
        }
        catch { }
    }
}