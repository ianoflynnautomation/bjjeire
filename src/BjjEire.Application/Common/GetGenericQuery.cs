using BjjEire.Domain.Entities;

namespace BjjEire.Application.Common;

#pragma warning disable S2326
public record GetGenericQuery<T, TC>(string Id) : IRequest<IQueryable<T>>
    where T : BaseApiEntityModel
    where TC : BaseEntity;
#pragma warning restore S2326
