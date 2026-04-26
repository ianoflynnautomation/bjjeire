// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities;

namespace BjjEire.Application.Common;

public class GetGenericQueryHandler<T, TC>(IRepository<TC> repository) : IRequestHandler<GetGenericQuery<T, TC>, IQueryable<T>>
    where T : BaseApiEntityModel
    where TC : BaseEntity
{
    private readonly IRepository<TC> _repository = repository;

    public async Task<IQueryable<T>> Handle(GetGenericQuery<T, TC> request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IQueryable<T> query = _repository.TableCollection<T>();

        return string.IsNullOrEmpty(request.Id) ?
        query :
        await Task.FromResult(query.Where(x => x.Id == request.Id));
    }
}
