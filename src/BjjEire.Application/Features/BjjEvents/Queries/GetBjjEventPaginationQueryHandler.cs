using BjjEire.Application.Common;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.BjjEvents.Caching;
using BjjEire.Application.Features.BjjEvents.Constants;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Application.Features.BjjEvents.Specifications;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Enums;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.BjjEvents.Queries;

public sealed class GetBjjEventByPaginationQueryHandler(
    IRepository<BjjEvent> bjjEventRepository,
    IMapper mapper,
    HybridCache hybridCache,
    IUriService uriService,
    TimeProvider timeProvider,
    ILogger<GetBjjEventByPaginationQueryHandler> logger)
    : IRequestHandler<GetBjjEventPaginationQuery, GetBjjEventPaginatedResponse>
{

    public async Task<GetBjjEventPaginatedResponse> Handle(GetBjjEventPaginationQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        string cacheKey = BjjEventCacheKeys.All(request.Page, request.PageSize, request.County, request.Type, request.IncludeInactive);

        GetBjjEventPaginationQueryHandlerLog.QueryStart(
            logger, nameof(GetBjjEventPaginationQuery),
            request.Page, request.PageSize,
            request.County?.ToString() ?? "N/A",
            request.Type?.ToString() ?? "N/A", cacheKey);

        GetBjjEventPaginatedResponse result = await hybridCache.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                GetBjjEventPaginationQueryHandlerLog.CacheMiss(logger, cacheKey);

                IQueryable<BjjEvent> query = bjjEventRepository.Table.Where(x => x.Status != EventStatus.Completed);

                if (!request.IncludeInactive)
                {
                    DateTime nowUtc = timeProvider.GetUtcNow().UtcDateTime;
                    query = query.Where(BjjEventSpecifications.Active(nowUtc));
                }

                if (request.County.HasValue)
                {
                    query = query.Where(x => x.County == request.County.Value);
                }

                if (request.Type.HasValue)
                {
                    query = query.Where(x => x.Type == request.Type.Value);
                }

                query = query.OrderBy(x => x.CreatedOnUtc);

                IQueryable<BjjEventDto> dtoQuery = query.ProjectTo<BjjEventDto>(mapper.ConfigurationProvider);
                PaginationFilter filter = new(request.Page, request.PageSize);

                PagedResponse<BjjEventDto> pagedData = await PaginationHelper.CreatePagedResponseAsync(
                    dtoQuery, filter,
                    BjjEventsApiConstants.ControllerName, BjjEventsApiConstants.GetAllActionName,
                    uriService, null, ct);

                return new GetBjjEventPaginatedResponse { Data = pagedData.Data, Pagination = pagedData.Pagination };
            },
            tags: [BjjEventCacheKeys.Tag],
            cancellationToken: cancellationToken);

        GetBjjEventPaginationQueryHandlerLog.QuerySuccess(
            logger, nameof(GetBjjEventPaginationQuery),
            result.Data.Count, result.Pagination.CurrentPage,
            result.Pagination.TotalItems, cacheKey);

        return result;
    }
}
