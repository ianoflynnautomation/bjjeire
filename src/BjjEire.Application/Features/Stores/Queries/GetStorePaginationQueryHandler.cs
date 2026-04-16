using BjjEire.Application.Common;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
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
    : IRequestHandler<GetStorePaginationQuery, GetStorePaginatedResponse>
{
    public async Task<GetStorePaginatedResponse> Handle(GetStorePaginationQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        string cacheKey = StoreCacheKeys.All(request.Page, request.PageSize);

        GetStorePaginationQueryHandlerLog.QueryStart(
            logger, nameof(GetStorePaginationQuery), request.Page, request.PageSize, cacheKey);

        GetStorePaginatedResponse result = await hybridCache.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                GetStorePaginationQueryHandlerLog.CacheMiss(logger, cacheKey);

                IOrderedQueryable<Store> query = storeRepository.Table
                    .Where(x => x.IsActive)
                    .OrderBy(x => x.Name);

                IQueryable<StoreDto> dtoQuery = query.ProjectTo<StoreDto>(mapper.ConfigurationProvider);
                PaginationFilter filter = new(request.Page, request.PageSize);

                PagedResponse<StoreDto> pagedData = await PaginationHelper.CreatePagedResponseAsync(
                    dtoQuery, filter,
                    StoresApiConstants.ControllerName, StoresApiConstants.GetAllActionName,
                    uriService, null, ct);

                return new GetStorePaginatedResponse { Data = pagedData.Data, Pagination = pagedData.Pagination };
            },
            tags: [StoreCacheKeys.Tag],
            cancellationToken: cancellationToken);

        GetStorePaginationQueryHandlerLog.QuerySuccess(
            logger, nameof(GetStorePaginationQuery),
            result.Data.Count, result.Pagination.CurrentPage,
            result.Pagination.TotalItems, cacheKey);

        return result;
    }
}
