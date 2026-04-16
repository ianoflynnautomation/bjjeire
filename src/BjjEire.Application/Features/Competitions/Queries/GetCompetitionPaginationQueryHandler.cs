using BjjEire.Application.Common;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
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
    : IRequestHandler<GetCompetitionPaginationQuery, GetCompetitionPaginatedResponse>
{
    public async Task<GetCompetitionPaginatedResponse> Handle(GetCompetitionPaginationQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        string cacheKey = CompetitionCacheKeys.All(request.Page, request.PageSize, request.IncludeInactive);

        GetCompetitionPaginationQueryHandlerLog.QueryStart(
            logger, nameof(GetCompetitionPaginationQuery),
            request.Page, request.PageSize, cacheKey);

        GetCompetitionPaginatedResponse result = await hybridCache.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                GetCompetitionPaginationQueryHandlerLog.CacheMiss(logger, cacheKey);

                IQueryable<Competition> query = competitionRepository.Table.AsQueryable();

                if (!request.IncludeInactive)
                {
                    DateTime nowUtc = timeProvider.GetUtcNow().UtcDateTime;
                    query = query.Where(CompetitionSpecifications.Active(nowUtc));
                }

                query = query.OrderBy(x => x.StartDate == null).ThenBy(x => x.StartDate).ThenBy(x => x.Name);

                IQueryable<CompetitionDto> dtoQuery = query.ProjectTo<CompetitionDto>(mapper.ConfigurationProvider);
                PaginationFilter filter = new(request.Page, request.PageSize);

                PagedResponse<CompetitionDto> pagedData = await PaginationHelper.CreatePagedResponseAsync(
                    dtoQuery, filter,
                    CompetitionsApiConstants.ControllerName, CompetitionsApiConstants.GetAllActionName,
                    uriService, null, ct);

                return new GetCompetitionPaginatedResponse { Data = pagedData.Data, Pagination = pagedData.Pagination };
            },
            tags: [CompetitionCacheKeys.Tag],
            cancellationToken: cancellationToken);

        GetCompetitionPaginationQueryHandlerLog.QuerySuccess(
            logger, nameof(GetCompetitionPaginationQuery),
            result.Data.Count, result.Pagination.CurrentPage,
            result.Pagination.TotalItems, cacheKey);

        return result;
    }
}
