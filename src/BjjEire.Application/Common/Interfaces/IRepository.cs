// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Linq.Expressions;

using BjjEire.Domain.Entities;

namespace BjjEire.Application.Common.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    public IQueryable<T> Table { get; }

    public Task<T> GetByIdAsync(string id);

    public Task<T> GetOneAsync(Expression<Func<T, bool>> predicate);

    public Task<T> InsertAsync(T entity);

    public Task<T> UpdateAsync(T entity);

    public Task UpdateFieldAsync<TU>(string id, Expression<Func<T, TU>> expression, TU value);

    public Task IncFieldAsync<TU>(string id, Expression<Func<T, TU>> expression, TU value);

    public Task UpdateOneAsync(Expression<Func<T, bool>> filterexpression, UpdateBuilder<T> updateBuilder);

    public Task<long> UpdateManyAsync(Expression<Func<T, bool>> filterexpression, UpdateBuilder<T> updateBuilder);

    public Task AddToSetAsync<TU>(string id, Expression<Func<T, IEnumerable<TU>>> field, TU value);

    public Task UpdateToSetAsync<TU, TZ>(string id, Expression<Func<T, IEnumerable<TU>>> field, Expression<Func<TU, TZ>> elemFieldMatch,
        TZ elemMatch, TU value);

    public Task UpdateToSetAsync<TU>(string id, Expression<Func<T, IEnumerable<TU>>> field, Expression<Func<TU, bool>> elemFieldMatch,
        TU value);

    public Task UpdateToSetAsync<TU>(Expression<Func<T, IEnumerable<TU>>> field, TU elemFieldMatch, TU value);

    public Task PullFilterAsync<TU, TZ>(string id, Expression<Func<T, IEnumerable<TU>>> field, Expression<Func<TU, TZ>> elemFieldMatch,
        TZ elemMatch);

    public Task PullFilterAsync<TU>(string id, Expression<Func<T, IEnumerable<TU>>> field, Expression<Func<TU, bool>> elemFieldMatch);

    public Task PullAsync(string id, Expression<Func<T, IEnumerable<string>>> field, string element);

    public Task<T> DeleteAsync(T entity);

    public Task DeleteAsync(IEnumerable<T> entities);

    public Task DeleteManyAsync(Expression<Func<T, bool>> filterExpression);

    public Task ClearAsync();

    public IQueryable<TC> TableCollection<TC>() where TC : class;
}
