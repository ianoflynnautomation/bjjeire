using BjjEire.Application.Common;
using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.BjjEvents.Constants;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Enums;
using BjjEire.SharedKernel.Logging;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.BjjEvents.Queries;

public sealed class GetBjjEventByPaginationQueryHandler(
    IRepository<BjjEvent> bjjEventRepository,
    IMapper mapper,
    HybridCache hybridCache,
    IUriService uriService,
    ILogger<GetBjjEventByPaginationQueryHandler> logger)
    : IRequestHandler<GetBjjEventPaginationQuery, GetBjjEventPaginatedResponse>
{

    public async Task<GetBjjEventPaginatedResponse> Handle(GetBjjEventPaginationQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var cacheKey = CacheKey.BjjEventsAll(request.Page, request.PageSize, request.County, request.Type);

        logger.LogInformation(
            ApplicationLogEvents.QueryHandling.Start,
            "Handling {QueryName}. Page: {PageNumber}, PageSize: {PageSize}, County: {County}, Type: {EventType}, CacheKey: {CacheKey}",
            nameof(GetBjjEventPaginationQuery), request.Page, request.PageSize,
            request.County?.ToString() ?? "N/A", request.Type?.ToString() ?? "N/A", cacheKey);

        var result = await hybridCache.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                logger.LogInformation(
                    ApplicationLogEvents.QueryHandling.FetchingFromRepositoryOnCacheMiss,
                    "Cache miss for {CacheKey}. Fetching BJJ events from repository.",
                    cacheKey);

                var query = bjjEventRepository.Table.Where(x => x.Status != EventStatus.Completed);

                if (request.County.HasValue)
                {
                    query = query.Where(x => x.County == request.County.Value);
                }

                if (request.Type.HasValue)
                {
                    query = query.Where(x => x.Type == request.Type.Value);
                }

                query = query.OrderBy(x => x.CreatedOnUtc);

                var dtoQuery = query.ProjectTo<BjjEventDto>(mapper.ConfigurationProvider);
                var filter = new PaginationFilter(request.Page, request.PageSize);

                var pagedData = await PaginationHelper.CreatePagedResponseAsync(
                    dtoQuery, filter,
                    BjjEventsApiConstants.ControllerName, BjjEventsApiConstants.GetAllActionName,
                    uriService, null, ct);

                return new GetBjjEventPaginatedResponse { Data = pagedData.Data, Pagination = pagedData.Pagination };
            },
            tags: [CacheKey.BjjEventsTag],
            cancellationToken: cancellationToken);

        logger.LogInformation(
            ApplicationLogEvents.QueryHandling.Success,
            "Successfully handled {QueryName}. Returned {ReturnedCount} items for Page {PageNumber} (Total: {TotalRecords}). CacheKey: {CacheKey}",
            nameof(GetBjjEventPaginationQuery), result.Data.Count,
            result.Pagination.CurrentPage, result.Pagination.TotalItems, cacheKey);

        return result;
    }
}
