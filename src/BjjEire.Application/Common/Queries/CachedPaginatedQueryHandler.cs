// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using BjjEire.Domain.Entities;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Common.Queries;

public abstract class CachedPaginatedQueryHandler<TEntity, TDto, TRequest>(
    IRepository<TEntity> repository,
    IMapper mapper,
    HybridCache hybridCache,
    IUriService uriService,
    ILogger logger)
    : IRequestHandler<TRequest, PagedResponse<TDto>>
    where TEntity : BaseEntity
    where TRequest : BasePaginationQuery, IRequest<PagedResponse<TDto>>
{
    protected abstract string BuildCacheKey(TRequest request);

    protected abstract string CacheTag { get; }

    protected abstract string ControllerName { get; }

    protected abstract string ActionName { get; }

    protected abstract IQueryable<TEntity> ApplyFilters(IQueryable<TEntity> source, TRequest request);

    protected abstract IOrderedQueryable<TEntity> ApplyOrdering(IQueryable<TEntity> source, TRequest request);

    public async Task<PagedResponse<TDto>> Handle(TRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        string cacheKey = BuildCacheKey(request);
        string entityName = typeof(TEntity).Name;

        PaginatedQueryLog.QueryStart(logger, entityName, request.Page, request.PageSize, cacheKey);

        PagedResponse<TDto> cached = await hybridCache.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                PaginatedQueryLog.CacheMiss(logger, entityName, cacheKey);

                IQueryable<TEntity> filtered = ApplyFilters(repository.Table, request);
                IOrderedQueryable<TEntity> ordered = ApplyOrdering(filtered, request);

                IQueryable<TDto> dtoQuery = ordered.ProjectTo<TDto>(mapper.ConfigurationProvider);
                PaginationFilter filter = new(request.Page, request.PageSize);

                return await PaginationHelper.CreatePagedDataAsync(dtoQuery, filter, ct);
            },
            tags: [CacheTag],
            cancellationToken: cancellationToken);

        PagedResponse<TDto> result = cached.WithNavigationLinks(ControllerName, ActionName, uriService);

        PaginatedQueryLog.QuerySuccess(
            logger, entityName,
            result.Data.Count, result.Pagination.CurrentPage,
            result.Pagination.TotalItems, cacheKey);

        return result;
    }
}
