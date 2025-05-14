using System.Linq.Expressions;
using BjjEire.Domain.Entities;

namespace BjjEire.Application.Common.Interfaces;

public interface IRepository<T> where T : BaseEntity {
    public IQueryable<T> Table { get; }
    public T GetById(string id);
    public Task<T> GetByIdAsync(string id);
    public Task<T> GetOneAsync(Expression<Func<T, bool>> predicate);
    public T Insert(T entity);
    public Task<T> InsertAsync(T entity);
    public T Update(T entity);
    public Task<T> UpdateAsync(T entity);
    public Task UpdateField<TU>(string id, Expression<Func<T, TU>> expression, TU value);
    public Task IncField<TU>(string id, Expression<Func<T, TU>> expression, TU value);
    public Task UpdateOneAsync(Expression<Func<T, bool>> filterexpression, UpdateBuilder<T> updateBuilder);
    public Task UpdateManyAsync(Expression<Func<T, bool>> filterexpression, UpdateBuilder<T> updateBuilder);
    public Task AddToSet<TU>(string id, Expression<Func<T, IEnumerable<TU>>> field, TU value);
    public Task UpdateToSet<TU, TZ>(string id, Expression<Func<T, IEnumerable<TU>>> field, Expression<Func<TU, TZ>> elemFieldMatch,
        TZ elemMatch, TU value);
    public Task UpdateToSet<TU>(string id, Expression<Func<T, IEnumerable<TU>>> field, Expression<Func<TU, bool>> elemFieldMatch,
        TU value);
    public Task UpdateToSet<TU>(Expression<Func<T, IEnumerable<TU>>> field, TU elemFieldMatch, TU value);
    public Task PullFilter<TU, TZ>(string id, Expression<Func<T, IEnumerable<TU>>> field, Expression<Func<TU, TZ>> elemFieldMatch,
        TZ elemMatch);
    public Task PullFilter<TU>(string id, Expression<Func<T, IEnumerable<TU>>> field, Expression<Func<TU, bool>> elemFieldMatch);
    public Task Pull(string id, Expression<Func<T, IEnumerable<string>>> field, string element);
    public void Delete(T entity);
    public Task<T> DeleteAsync(T entity);
    public Task DeleteAsync(IEnumerable<T> entities);
    public Task DeleteManyAsync(Expression<Func<T, bool>> filterExpression);
    public Task ClearAsync();
    public IQueryable<TC> TableCollection<TC>() where TC : class;
}