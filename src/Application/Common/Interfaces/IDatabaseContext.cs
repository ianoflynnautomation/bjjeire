
using BjjWorld.Domain.Entities;

namespace BjjWorld.Application.Common.Interfaces;

public interface IDatabaseContext
{
    public Task<bool> DatabaseExist();
    public Task CreateCollection(string name, string collation);
    public Task DeleteCollection(string name);
    public Task CreateIndex<T>(IRepository<T> repository, OrderBuilder<T> orderBuilder, string indexName, bool unique = false)
        where T : BaseEntity;
    public Task DeleteIndex<T>(IRepository<T> repository, string indexName) where T : BaseEntity;
}