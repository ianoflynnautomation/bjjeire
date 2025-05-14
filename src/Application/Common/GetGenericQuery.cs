

using BjjWorld.Domain.Entities;

namespace BjjWorld.Application.Common;

public record GetGenericQuery<T, TC>(string Id) : IRequest<IQueryable<T>>
    where T : BaseApiEntityModel
    where TC : BaseEntity;