

using BjjWorld.Domain.Entities;

namespace BjjWorld.Application.Common;

public record GetGenericQuery<T, C>(string Id) : IRequest<IQueryable<T>>
    where T : BaseApiEntityModel
    where C : BaseEntity;