
using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Domain.Entities;

namespace BjjWorld.Application.Common;

public class GetGenericQueryHandler<T, C>(IRepository<C> repository) : IRequestHandler<GetGenericQuery<T, C>, IQueryable<T>>
    where T : BaseApiEntityModel
    where C : BaseEntity
{
    private readonly IRepository<C> _repository = repository;

    public async Task<IQueryable<T>> Handle(GetGenericQuery<T, C> request, CancellationToken cancellationToken)
    {
        var query = _repository.TableCollection<T>();

        return string.IsNullOrEmpty(request.Id) ? 
        query : 
        await Task.FromResult(query.Where(x => x.Id == request.Id));
    }
}