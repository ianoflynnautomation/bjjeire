using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Queries;
using BjjEire.Application.Features.Stores.Caching;
using BjjEire.Application.Features.Stores.Constants;
using BjjEire.Application.Features.Stores.DTOs;
using BjjEire.Domain.Entities.Stores;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Stores.Queries;

public sealed class GetStorePaginationQueryHandler(
    IRepository<Store> storeRepository,
    IMapper mapper,
    HybridCache hybridCache,
    IUriService uriService,
    ILogger<GetStorePaginationQueryHandler> logger)
    : CachedPaginatedQueryHandler<Store, StoreDto, GetStorePaginationQuery>(
        storeRepository, mapper, hybridCache, uriService, logger)
{
    protected override string BuildCacheKey(GetStorePaginationQuery request)
        => StoreCacheKeys.All(request.Page, request.PageSize);

    protected override string CacheTag => StoreCacheKeys.Tag;

    protected override string ControllerName => StoresApiConstants.ControllerName;

    protected override string ActionName => StoresApiConstants.GetAllActionName;

    protected override IQueryable<Store> ApplyFilters(IQueryable<Store> source, GetStorePaginationQuery request)
        => source.Where(x => x.IsActive);

    protected override IOrderedQueryable<Store> ApplyOrdering(IQueryable<Store> source, GetStorePaginationQuery request)
        => source.OrderBy(x => x.Name);
}
