// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Queries;
using BjjEire.Application.Features.Gyms.Caching;
using BjjEire.Application.Features.Gyms.Constants;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Enums;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Gyms.Queries;

public sealed class GetGymPaginationQueryHandler(
    IRepository<Gym> gymRepository,
    IMapper mapper,
    HybridCache hybridCache,
    IUriService uriService,
    ILogger<GetGymPaginationQueryHandler> logger)
    : CachedPaginatedQueryHandler<Gym, GymDto, GetGymPaginationQuery>(
        gymRepository, mapper, hybridCache, uriService, logger)
{
    protected override string BuildCacheKey(GetGymPaginationQuery request)
        => GymCacheKeys.All(request.Page, request.PageSize, request.County);

    protected override string CacheTag => GymCacheKeys.Tag;

    protected override string ControllerName => GymsApiConstants.ControllerName;

    protected override string ActionName => GymsApiConstants.GetAllActionName;

    protected override IQueryable<Gym> ApplyFilters(IQueryable<Gym> source, GetGymPaginationQuery request)
    {
        IQueryable<Gym> query = source.Where(x => x.Status == GymStatus.Active);

        if (request.County.HasValue)
        {
            query = query.Where(x => x.County == request.County.Value);
        }

        return query;
    }

    protected override IOrderedQueryable<Gym> ApplyOrdering(IQueryable<Gym> source, GetGymPaginationQuery request)
        => source.OrderBy(x => x.Name);
}
