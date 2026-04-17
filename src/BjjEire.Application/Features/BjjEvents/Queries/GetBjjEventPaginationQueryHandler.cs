using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Queries;
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
    : CachedPaginatedQueryHandler<BjjEvent, BjjEventDto, GetBjjEventPaginationQuery>(
        bjjEventRepository, mapper, hybridCache, uriService, logger)
{
    protected override string BuildCacheKey(GetBjjEventPaginationQuery request)
        => BjjEventCacheKeys.All(request.Page, request.PageSize, request.County, request.Type, request.IncludeInactive);

    protected override string CacheTag => BjjEventCacheKeys.Tag;

    protected override string ControllerName => BjjEventsApiConstants.ControllerName;

    protected override string ActionName => BjjEventsApiConstants.GetAllActionName;

    protected override IQueryable<BjjEvent> ApplyFilters(IQueryable<BjjEvent> source, GetBjjEventPaginationQuery request)
    {
        IQueryable<BjjEvent> query = source.Where(x => x.Status != EventStatus.Completed);

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

        return query;
    }

    protected override IOrderedQueryable<BjjEvent> ApplyOrdering(IQueryable<BjjEvent> source, GetBjjEventPaginationQuery request)
        => source.OrderBy(x => x.CreatedOnUtc);
}
