using BjjEire.Application.Common;
using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Competitions.Constants;
using BjjEire.Application.Features.Competitions.DTOs;
using BjjEire.Domain.Entities.Competitions;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Competitions.Queries;

public sealed class GetCompetitionPaginationQueryHandler(
    IRepository<Competition> competitionRepository,
    IMapper mapper,
    HybridCache hybridCache,
    IUriService uriService,
    ILogger<GetCompetitionPaginationQueryHandler> logger)
    : IRequestHandler<GetCompetitionPaginationQuery, GetCompetitionPaginatedResponse>
{
    public async Task<GetCompetitionPaginatedResponse> Handle(GetCompetitionPaginationQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var cacheKey = CacheKey.CompetitionsAll(request.Page, request.PageSize, request.Organisation);

        GetCompetitionPaginationQueryHandlerLog.QueryStart(
            logger, nameof(GetCompetitionPaginationQuery),
            request.Page, request.PageSize,
            request.Organisation?.ToString() ?? "N/A", cacheKey);

        var result = await hybridCache.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                GetCompetitionPaginationQueryHandlerLog.CacheMiss(logger, cacheKey);

                var query = competitionRepository.Table.Where(x => x.IsActive);

                if (request.Organisation.HasValue)
                {
                    query = query.Where(x => x.Organisation == request.Organisation.Value);
                }

                query = query.OrderBy(x => x.StartDate == null).ThenBy(x => x.StartDate).ThenBy(x => x.Name);

                var dtoQuery = query.ProjectTo<CompetitionDto>(mapper.ConfigurationProvider);
                var filter = new PaginationFilter(request.Page, request.PageSize);

                var pagedData = await PaginationHelper.CreatePagedResponseAsync(
                    dtoQuery, filter,
                    CompetitionsApiConstants.ControllerName, CompetitionsApiConstants.GetAllActionName,
                    uriService, null, ct);

                return new GetCompetitionPaginatedResponse { Data = pagedData.Data, Pagination = pagedData.Pagination };
            },
            tags: [CacheKey.CompetitionsTag],
            cancellationToken: cancellationToken);

        GetCompetitionPaginationQueryHandlerLog.QuerySuccess(
            logger, nameof(GetCompetitionPaginationQuery),
            result.Data.Count, result.Pagination.CurrentPage,
            result.Pagination.TotalItems, cacheKey);

        return result;
    }
}
