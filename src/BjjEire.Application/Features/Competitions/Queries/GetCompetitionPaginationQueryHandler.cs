// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Queries;
using BjjEire.Application.Features.Competitions.Caching;
using BjjEire.Application.Features.Competitions.Constants;
using BjjEire.Application.Features.Competitions.DTOs;
using BjjEire.Application.Features.Competitions.Specifications;
using BjjEire.Domain.Entities.Competitions;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Competitions.Queries;

public sealed class GetCompetitionPaginationQueryHandler(
    IRepository<Competition> competitionRepository,
    IMapper mapper,
    HybridCache hybridCache,
    IUriService uriService,
    TimeProvider timeProvider,
    ILogger<GetCompetitionPaginationQueryHandler> logger)
    : CachedPaginatedQueryHandler<Competition, CompetitionDto, GetCompetitionPaginationQuery>(
        competitionRepository, mapper, hybridCache, uriService, logger)
{
    protected override string BuildCacheKey(GetCompetitionPaginationQuery request)
        => CompetitionCacheKeys.All(request.Page, request.PageSize, request.IncludeInactive);

    protected override string CacheTag => CompetitionCacheKeys.Tag;

    protected override string ControllerName => CompetitionsApiConstants.ControllerName;

    protected override string ActionName => CompetitionsApiConstants.GetAllActionName;

    protected override IQueryable<Competition> ApplyFilters(IQueryable<Competition> source, GetCompetitionPaginationQuery request)
    {
        if (request.IncludeInactive)
        {
            return source;
        }

        DateTime nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        return source.Where(CompetitionSpecifications.Active(nowUtc));
    }

    protected override IOrderedQueryable<Competition> ApplyOrdering(IQueryable<Competition> source, GetCompetitionPaginationQuery request)
        => source.OrderBy(x => x.StartDate == null).ThenBy(x => x.StartDate).ThenBy(x => x.Name);
}
