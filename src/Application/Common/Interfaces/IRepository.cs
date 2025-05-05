using System.Linq.Expressions;
using BjjWorld.Domain.Entities;

namespace BjjWorld.Application.Common.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    IQueryable<T> Table { get; }
    T GetById(string id);
    Task<T> GetByIdAsync(string id);
    Task<T> GetOneAsync(Expression<Func<T, bool>> predicate);
    T Insert(T entity);
    Task<T> InsertAsync(T entity);
    T Update(T entity);
    Task<T> UpdateAsync(T entity);
    Task UpdateField<U>(string id, Expression<Func<T, U>> expression, U value);
    Task IncField<U>(string id, Expression<Func<T, U>> expression, U value);
    Task UpdateOneAsync(Expression<Func<T, bool>> filterexpression, UpdateBuilder<T> updateBuilder);
    Task UpdateManyAsync(Expression<Func<T, bool>> filterexpression, UpdateBuilder<T> updateBuilder);
    Task AddToSet<U>(string id, Expression<Func<T, IEnumerable<U>>> field, U value);
    Task UpdateToSet<U, Z>(string id, Expression<Func<T, IEnumerable<U>>> field, Expression<Func<U, Z>> elemFieldMatch,
        Z elemMatch, U value);
    Task UpdateToSet<U>(string id, Expression<Func<T, IEnumerable<U>>> field, Expression<Func<U, bool>> elemFieldMatch,
        U value);
    Task UpdateToSet<U>(Expression<Func<T, IEnumerable<U>>> field, U elemFieldMatch, U value);
    Task PullFilter<U, Z>(string id, Expression<Func<T, IEnumerable<U>>> field, Expression<Func<U, Z>> elemFieldMatch,
        Z elemMatch);
    Task PullFilter<U>(string id, Expression<Func<T, IEnumerable<U>>> field, Expression<Func<U, bool>> elemFieldMatch);
    Task Pull(string id, Expression<Func<T, IEnumerable<string>>> field, string element);
    void Delete(T entity);
    Task<T> DeleteAsync(T entity);
    Task DeleteAsync(IEnumerable<T> entities);
    Task DeleteManyAsync(Expression<Func<T, bool>> filterExpression);
    Task ClearAsync();
    IQueryable<C> TableCollection<C>() where C : class;    
}