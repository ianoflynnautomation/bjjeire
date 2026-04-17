
using System.Reflection;

using BjjEire.Application.Common;
using BjjEire.Application.Common.Exceptions;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities;

using Microsoft.Extensions.Logging;

namespace BjjEire.Infrastructure.Data.Mongo;

public class MongoRepository<T> : IRepository<T> where T : BaseEntity
{
    private readonly IAuditInfoProvider _auditInfoProvider;
    private readonly ILogger<MongoRepository<T>> _logger;

    public IMongoCollection<T> Collection { get; }

    protected IMongoDatabase Database { get; }

    public MongoRepository(IMongoDatabase database, IAuditInfoProvider auditInfoProvider, ILogger<MongoRepository<T>> logger)
    {
        ArgumentNullException.ThrowIfNull(database);
        ArgumentNullException.ThrowIfNull(auditInfoProvider);
        ArgumentNullException.ThrowIfNull(logger);

        Database = database;
        _auditInfoProvider = auditInfoProvider;
        _logger = logger;
        string collectionName = typeof(T).Name;
        Collection = Database.GetCollection<T>(collectionName);
    }

    public virtual Task<T> GetByIdAsync(string id) => Collection.Find(e => e.Id == id).FirstOrDefaultAsync();

    public virtual Task<T> GetOneAsync(Expression<Func<T, bool>> predicate) => Collection.Find(predicate).FirstOrDefaultAsync();

    public virtual async Task<T> InsertAsync(T entity)
    {
        ArgumentNullException.ThrowIfNull(entity);
        entity.CreatedOnUtc = _auditInfoProvider.GetCurrentDateTime();
        entity.CreatedBy = _auditInfoProvider.GetCurrentUser();
        await Collection.InsertOneAsync(entity);
        return entity;
    }

    public virtual async Task<T> UpdateAsync(T entity)
    {
        ArgumentNullException.ThrowIfNull(entity);
        entity.UpdatedOnUtc = _auditInfoProvider.GetCurrentDateTime();
        entity.UpdatedBy = _auditInfoProvider.GetCurrentUser();
        _ = await Collection.ReplaceOneAsync(x => x.Id == entity.Id, entity,
            new ReplaceOptions { IsUpsert = false });
        return entity;
    }

    public virtual async Task UpdateFieldAsync<TU>(string id, Expression<Func<T, TU>> expression, TU value)
    {
        FilterDefinitionBuilder<T> builder = Builders<T>.Filter;
        FilterDefinition<T> filter = builder.Eq(x => x.Id, id);
        UpdateDefinition<T> update = Builders<T>.Update
            .Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime())
            .Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser())
            .Set(expression, value);

        _ = await Collection.UpdateOneAsync(filter, update);
    }

    public virtual async Task IncFieldAsync<TU>(string id, Expression<Func<T, TU>> expression, TU value)
    {
        FilterDefinitionBuilder<T> builder = Builders<T>.Filter;
        FilterDefinition<T> filter = builder.Eq(x => x.Id, id);
        UpdateDefinition<T> update = Builders<T>.Update
            .Inc(expression, value);

        _ = await Collection.UpdateOneAsync(filter, update);
    }

    public virtual async Task UpdateOneAsync(Expression<Func<T, bool>> filterexpression,
        UpdateBuilder<T> updateBuilder)
    {
        ArgumentNullException.ThrowIfNull(updateBuilder);
        _ = updateBuilder.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        _ = updateBuilder.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        UpdateDefinition<T> update = Builders<T>.Update.Combine(updateBuilder.Fields);
        _ = await Collection.UpdateOneAsync(filterexpression, update);
    }

    public virtual async Task<long> UpdateManyAsync(Expression<Func<T, bool>> filterexpression,
        UpdateBuilder<T> updateBuilder)
    {
        ArgumentNullException.ThrowIfNull(updateBuilder);
        _ = updateBuilder.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        _ = updateBuilder.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        UpdateDefinition<T> update = Builders<T>.Update.Combine(updateBuilder.Fields);
        UpdateResult result = await Collection.UpdateManyAsync(filterexpression, update);
        return result.IsAcknowledged ? result.ModifiedCount : 0;
    }

    public virtual async Task AddToSetAsync<TU>(string id, Expression<Func<T, IEnumerable<TU>>> field, TU value)
    {
        FilterDefinitionBuilder<T> builder = Builders<T>.Filter;
        FilterDefinition<T> filter = builder.Eq(x => x.Id, id);
        UpdateDefinition<T> update = Builders<T>.Update.AddToSet(field, value);

        UpdateDefinition<T> updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        UpdateDefinition<T> updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        UpdateDefinition<T> combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);
        _ = await Collection.UpdateOneAsync(filter, combinedUpdate);
    }

    public virtual async Task UpdateToSetAsync<TU, TZ>(string id, Expression<Func<T, IEnumerable<TU>>> field,
        Expression<Func<TU, TZ>> elemFieldMatch, TZ elemMatch, TU value)
    {
        FilterDefinition<T> filter = Builders<T>.Filter.Eq(x => x.Id, id)
                     & Builders<T>.Filter.ElemMatch(field, Builders<TU>.Filter.Eq(elemFieldMatch, elemMatch));

        ArgumentNullException.ThrowIfNull(field);
        MemberExpression me = (MemberExpression)field.Body;
        MemberInfo minfo = me.Member;
        UpdateDefinition<T> update = Builders<T>.Update.Set($"{minfo.Name}.$", value);
        UpdateDefinition<T> updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        UpdateDefinition<T> updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        UpdateDefinition<T> combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);

        _ = await Collection.UpdateOneAsync(filter, combinedUpdate);
    }

    public virtual async Task UpdateToSetAsync<TU>(string id, Expression<Func<T, IEnumerable<TU>>> field,
        Expression<Func<TU, bool>> elemFieldMatch, TU value)
    {
        FilterDefinition<T> filter = string.IsNullOrEmpty(id)
            ? Builders<T>.Filter.Where(x => true)
            : Builders<T>.Filter.Eq(x => x.Id, id)
              & Builders<T>.Filter.ElemMatch(field, elemFieldMatch);

        ArgumentNullException.ThrowIfNull(field);
        MemberExpression me = (MemberExpression)field.Body;
        MemberInfo minfo = me.Member;
        UpdateDefinition<T> update = Builders<T>.Update.Set($"{minfo.Name}.$", value);

        UpdateDefinition<T> updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        UpdateDefinition<T> updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        UpdateDefinition<T> combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);
        _ = string.IsNullOrEmpty(id)
            ? await Collection.UpdateManyAsync(filter, combinedUpdate)
            : await Collection.UpdateOneAsync(filter, combinedUpdate);
    }

    public virtual async Task UpdateToSetAsync<TU>(Expression<Func<T, IEnumerable<TU>>> field, TU elemFieldMatch, TU value)
    {
        ArgumentNullException.ThrowIfNull(field);
        MemberExpression me = (MemberExpression)field.Body;
        MemberInfo minfo = me.Member;

#pragma warning disable CS8602 // Dereference of a possibly null reference.
        BsonDocument filter =
        [
            new BsonElement(minfo.Name, elemFieldMatch.ToString())
        ];
#pragma warning restore CS8602 // Dereference of a possibly null reference.

        UpdateDefinition<T> update = Builders<T>.Update.Set($"{minfo.Name}.$", value);

        UpdateDefinition<T> updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        UpdateDefinition<T> updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        UpdateDefinition<T> combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);

        _ = await Collection.UpdateManyAsync(filter, combinedUpdate);
    }

    public virtual async Task PullFilterAsync<TU, TZ>(string id, Expression<Func<T, IEnumerable<TU>>> field,
        Expression<Func<TU, TZ>> elemFieldMatch, TZ elemMatch)
    {
        FilterDefinition<T> filter = string.IsNullOrEmpty(id)
            ? Builders<T>.Filter.Where(x => true)
            : Builders<T>.Filter.Eq(x => x.Id, id);
        UpdateDefinition<T> update = Builders<T>.Update.PullFilter(field, Builders<TU>.Filter.Eq(elemFieldMatch, elemMatch));

        UpdateDefinition<T> updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        UpdateDefinition<T> updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        UpdateDefinition<T> combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);

        _ = string.IsNullOrEmpty(id)
            ? await Collection.UpdateManyAsync(filter, combinedUpdate)
            : await Collection.UpdateOneAsync(filter, combinedUpdate);
    }

    public virtual async Task PullFilterAsync<TU>(string id, Expression<Func<T, IEnumerable<TU>>> field,
        Expression<Func<TU, bool>> elemFieldMatch)
    {
        FilterDefinition<T> filter = Builders<T>.Filter.Eq(x => x.Id, id);
        UpdateDefinition<T> update = Builders<T>.Update.PullFilter(field, elemFieldMatch);

        UpdateDefinition<T> updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        UpdateDefinition<T> updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        UpdateDefinition<T> combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);

        _ = await Collection.UpdateOneAsync(filter, combinedUpdate);
    }

    public virtual async Task PullAsync(string id, Expression<Func<T, IEnumerable<string>>> field, string element)
    {
        UpdateDefinition<T> update = Builders<T>.Update.Pull(field, element);

        UpdateDefinition<T> updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        UpdateDefinition<T> updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        UpdateDefinition<T> combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);

        _ = string.IsNullOrEmpty(id)
            ? await Collection.UpdateManyAsync(Builders<T>.Filter.Where(x => true), combinedUpdate)
            : await Collection.UpdateOneAsync(Builders<T>.Filter.Eq(x => x.Id, id), combinedUpdate);
    }

    public virtual async Task<T> DeleteAsync(T entity)
    {
        ArgumentNullException.ThrowIfNull(entity);

        FilterDefinition<T> filter = Builders<T>.Filter.Eq(e => e.Id, entity.Id);
        DeleteResult result = await Collection.DeleteOneAsync(filter);

        if (result.IsAcknowledged && result.DeletedCount == 0)
        {
            MongoRepositoryLog.ConcurrencyConflict(_logger, entity.Id, typeof(T).Name);
            throw new ConcurrencyException($"Concurrency conflict for entity with ID {entity.Id}.");
        }

        return entity;
    }

    public virtual async Task DeleteAsync(IEnumerable<T> entities)
    {
        ArgumentNullException.ThrowIfNull(entities);
        List<string> ids = entities.Select(e => e.Id).ToList();
        if (ids.Count == 0)
            return;
        FilterDefinition<T> filter = Builders<T>.Filter.In(e => e.Id, ids);
        _ = await Collection.DeleteManyAsync(filter);
    }

    public virtual async Task DeleteManyAsync(Expression<Func<T, bool>> filterExpression) => _ = await Collection.DeleteManyAsync(filterExpression);
    public Task ClearAsync() => Collection.DeleteManyAsync(Builders<T>.Filter.Empty);

    public virtual IQueryable<T> Table => Collection.AsQueryable();

    public virtual IQueryable<TC> TableCollection<TC>() where TC : class => Database.GetCollection<TC>(typeof(T).Name).AsQueryable();
}
