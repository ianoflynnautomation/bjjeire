
using BjjWorld.Domain.Entities;

namespace BjjWorld.Application.Common.Interfaces;

public interface IDatabaseContext
{    
    Task<bool> DatabaseExist();   
    Task CreateCollection(string name, string collation);
    Task DeleteCollection(string name);
    Task CreateIndex<T>(IRepository<T> repository, OrderBuilder<T> orderBuilder, string indexName, bool unique = false)
        where T : BaseEntity;
    Task DeleteIndex<T>(IRepository<T> repository, string indexName) where T : BaseEntity;
}