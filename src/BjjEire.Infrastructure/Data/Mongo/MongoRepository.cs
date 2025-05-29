
using BjjEire.Application.Common;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities;

namespace BjjEire.Infrastructure.Data.Mongo;

public class MongoRepository<T> : IRepository<T> where T : BaseEntity
{
    private readonly IAuditInfoProvider _auditInfoProvider;

    public IMongoCollection<T> Collection { get; }

    protected IMongoDatabase Database { get; }

    public MongoRepository(IMongoDatabase database, IAuditInfoProvider auditInfoProvider)
    {
        ArgumentNullException.ThrowIfNull(database);
        ArgumentNullException.ThrowIfNull(auditInfoProvider);

        Database = database;
        _auditInfoProvider = auditInfoProvider;
        var collectionName = typeof(T).Name;
        Collection = Database.GetCollection<T>(collectionName);
    }

    public virtual T GetById(string id) => Collection.Find(e => e.Id == id).FirstOrDefault();

    public virtual Task<T> GetByIdAsync(string id) => Collection.Find(e => e.Id == id).FirstOrDefaultAsync();

    public virtual Task<T> GetOneAsync(Expression<Func<T, bool>> predicate) => Collection.Find(predicate).FirstOrDefaultAsync();

    public virtual T Insert(T entity)
    {
        ArgumentNullException.ThrowIfNull(entity);
        entity.CreatedOnUtc = _auditInfoProvider.GetCurrentDateTime();
        entity.CreatedBy = _auditInfoProvider.GetCurrentUser();
        Collection.InsertOne(entity);
        return entity;
    }

    public virtual async Task<T> InsertAsync(T entity)
    {
        ArgumentNullException.ThrowIfNull(entity);
        entity.CreatedOnUtc = _auditInfoProvider.GetCurrentDateTime();
        entity.CreatedBy = _auditInfoProvider.GetCurrentUser();
        await Collection.InsertOneAsync(entity);
        return entity;
    }

    public virtual T Update(T entity)
    {
        ArgumentNullException.ThrowIfNull(entity);
        entity.UpdatedOnUtc = _auditInfoProvider.GetCurrentDateTime();
        entity.UpdatedBy = _auditInfoProvider.GetCurrentUser();
        _ = Collection.ReplaceOne(x => x.Id == entity.Id, entity, new ReplaceOptions { IsUpsert = false });
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
        var builder = Builders<T>.Filter;
        var filter = builder.Eq(x => x.Id, id);
        var update = Builders<T>.Update
            .Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime())
            .Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser())
            .Set(expression, value);

        _ = await Collection.UpdateOneAsync(filter, update);
    }

    public virtual async Task IncFieldAsync<TU>(string id, Expression<Func<T, TU>> expression, TU value)
    {
        var builder = Builders<T>.Filter;
        var filter = builder.Eq(x => x.Id, id);
        var update = Builders<T>.Update
            .Inc(expression, value);

        _ = await Collection.UpdateOneAsync(filter, update);
    }

    public virtual async Task UpdateOneAsync(Expression<Func<T, bool>> filterExpression,
        UpdateBuilder<T> updateBuilder)
    {
        ArgumentNullException.ThrowIfNull(updateBuilder);
        _ = updateBuilder.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        _ = updateBuilder.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        var update = Builders<T>.Update.Combine(updateBuilder.Fields);
        _ = await Collection.UpdateOneAsync(filterExpression, update);
    }

    public virtual async Task UpdateManyAsync(Expression<Func<T, bool>> filterExpression,
        UpdateBuilder<T> updateBuilder)
    {
        ArgumentNullException.ThrowIfNull(updateBuilder);
        _ = updateBuilder.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        _ = updateBuilder.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        var update = Builders<T>.Update.Combine(updateBuilder.Fields);
        _ = await Collection.UpdateManyAsync(filterExpression, update);
    }

    public virtual async Task AddToSetAsync<TU>(string id, Expression<Func<T, IEnumerable<TU>>> field, TU value)
    {
        var builder = Builders<T>.Filter;
        var filter = builder.Eq(x => x.Id, id);
        var update = Builders<T>.Update.AddToSet(field, value);

        var updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        var updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        var combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);
        _ = await Collection.UpdateOneAsync(filter, combinedUpdate);
    }

    public virtual async Task UpdateToSetAsync<TU, TZ>(string id, Expression<Func<T, IEnumerable<TU>>> field,
        Expression<Func<TU, TZ>> elemFieldMatch, TZ elemMatch, TU value)
    {
        var filter = Builders<T>.Filter.Eq(x => x.Id, id)
                     & Builders<T>.Filter.ElemMatch(field, Builders<TU>.Filter.Eq(elemFieldMatch, elemMatch));

        ArgumentNullException.ThrowIfNull(field);
        var me = (MemberExpression)field.Body;
        var minfo = me.Member;
        var update = Builders<T>.Update.Set($"{minfo.Name}.$", value);
        var updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        var updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        var combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);

        _ = await Collection.UpdateOneAsync(filter, combinedUpdate);
    }

    public virtual async Task UpdateToSetAsync<TU>(string id, Expression<Func<T, IEnumerable<TU>>> field,
        Expression<Func<TU, bool>> elemFieldMatch, TU value)
    {
        var filter = string.IsNullOrEmpty(id)
            ? Builders<T>.Filter.Where(x => true)
            : Builders<T>.Filter.Eq(x => x.Id, id)
              & Builders<T>.Filter.ElemMatch(field, elemFieldMatch);

        ArgumentNullException.ThrowIfNull(field);
        var me = (MemberExpression)field.Body;
        var minfo = me.Member;
        var update = Builders<T>.Update.Set($"{minfo.Name}.$", value);

        var updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        var updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        var combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);
        _ = string.IsNullOrEmpty(id)
            ? await Collection.UpdateManyAsync(filter, combinedUpdate)
            : await Collection.UpdateOneAsync(filter, combinedUpdate);
    }

    public virtual async Task UpdateToSetAsync<TU>(Expression<Func<T, IEnumerable<TU>>> field, TU elemFieldMatch, TU value)
    {
        ArgumentNullException.ThrowIfNull(field);
        var me = (MemberExpression)field.Body;
        var minfo = me.Member;

#pragma warning disable CS8602 // Dereference of a possibly null reference.
        var filter = new BsonDocument {
            new BsonElement(minfo.Name, elemFieldMatch.ToString())
        };
#pragma warning restore CS8602 // Dereference of a possibly null reference.

        var update = Builders<T>.Update.Set($"{minfo.Name}.$", value);

        var updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        var updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        var combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);

        _ = await Collection.UpdateManyAsync(filter, combinedUpdate);
    }

    public virtual async Task PullFilterAsync<TU, TZ>(string id, Expression<Func<T, IEnumerable<TU>>> field,
        Expression<Func<TU, TZ>> elemFieldMatch, TZ elemMatch)
    {
        var filter = string.IsNullOrEmpty(id)
            ? Builders<T>.Filter.Where(x => true)
            : Builders<T>.Filter.Eq(x => x.Id, id);
        var update = Builders<T>.Update.PullFilter(field, Builders<TU>.Filter.Eq(elemFieldMatch, elemMatch));

        var updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        var updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        var combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);

        _ = string.IsNullOrEmpty(id)
            ? await Collection.UpdateManyAsync(filter, combinedUpdate)
            : await Collection.UpdateOneAsync(filter, combinedUpdate);
    }

    public virtual async Task PullFilterAsync<TU>(string id, Expression<Func<T, IEnumerable<TU>>> field,
        Expression<Func<TU, bool>> elemFieldMatch)
    {
        var filter = Builders<T>.Filter.Eq(x => x.Id, id);
        var update = Builders<T>.Update.PullFilter(field, elemFieldMatch);

        var updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        var updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        var combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);

        _ = await Collection.UpdateOneAsync(filter, combinedUpdate);
    }

    public virtual async Task PullAsync(string id, Expression<Func<T, IEnumerable<string>>> field, string element)
    {
        var update = Builders<T>.Update.Pull(field, element);

        var updateDate = Builders<T>.Update.Set(x => x.UpdatedOnUtc, _auditInfoProvider.GetCurrentDateTime());
        var updateUser = Builders<T>.Update.Set(x => x.UpdatedBy, _auditInfoProvider.GetCurrentUser());
        var combinedUpdate = Builders<T>.Update.Combine(update, updateDate, updateUser);

        _ = string.IsNullOrEmpty(id)
            ? await Collection.UpdateManyAsync(Builders<T>.Filter.Where(x => true), combinedUpdate)
            : await Collection.UpdateOneAsync(Builders<T>.Filter.Eq(x => x.Id, id), combinedUpdate);
    }

    public virtual void Delete(T entity) => _ = Collection.FindOneAndDelete(e => e.Id == entity.Id);

    public virtual async Task<T> DeleteAsync(T entity)
    {
        _ = await Collection.DeleteOneAsync(e => e.Id == entity.Id);
        return entity;
    }

    public virtual async Task DeleteAsync(IEnumerable<T> entities)
    {
        ArgumentNullException.ThrowIfNull(entities);
        foreach (var entity in entities)
        {
            _ = await DeleteAsync(entity);
        }
    }

    public virtual async Task DeleteManyAsync(Expression<Func<T, bool>> filterExpression) => _ = await Collection.DeleteManyAsync(filterExpression);
    public Task ClearAsync() => Collection.DeleteManyAsync(Builders<T>.Filter.Empty);


    public virtual IQueryable<T> Table => Collection.AsQueryable();

    public virtual IQueryable<TC> TableCollection<TC>() where TC : class => Database.GetCollection<TC>(typeof(T).Name).AsQueryable();

}