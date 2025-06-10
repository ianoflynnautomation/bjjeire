
using BjjEire.Domain.Entities;

namespace BjjEire.Application.Common.Interfaces;

public interface IDatabaseContext {
    public Task<bool> DatabaseExistAsync();
    public Task CreateCollectionAsync(string name, string collation);
    public Task DeleteCollectionAsync(string name);
    public Task CreateIndexAsync<T>(IRepository<T> repository, OrderBuilder<T> orderBuilder, string indexName, bool unique = false)
        where T : BaseEntity;
    public Task DeleteIndexAsync<T>(IRepository<T> repository, string indexName) where T : BaseEntity;
}
