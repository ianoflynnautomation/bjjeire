using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;

namespace BjjEire.Application.Common;

public static class PaginationHelper
{
    public static async Task<PagedResponse<T>> CreatePagedDataAsync<T>(
        IQueryable<T> source,
        PaginationFilter filter,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(filter);

        int totalRecords = await source.CountAsync(cancellationToken);
        List<T> pagedData = await source
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        int totalPages = (int)Math.Ceiling(totalRecords / (double)filter.PageSize);

        return new PagedResponse<T>
        {
            Data = pagedData,
            Pagination = new PaginationMetadataDto
            {
                TotalItems = totalRecords,
                CurrentPage = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalPages = totalPages,
                HasNextPage = filter.PageNumber < totalPages,
                HasPreviousPage = filter.PageNumber > 1,
            }
        };
    }

    public static PagedResponse<T> WithNavigationLinks<T>(
        this PagedResponse<T> paged,
        string controllerName,
        string actionName,
        IUriService uriService,
        IDictionary<string, object?>? additionalRouteValues = null)
    {
        ArgumentNullException.ThrowIfNull(paged);
        ArgumentNullException.ThrowIfNull(controllerName);
        ArgumentNullException.ThrowIfNull(actionName);
        ArgumentNullException.ThrowIfNull(uriService);

        PaginationMetadataDto meta = paged.Pagination;

        return paged with
        {
            Pagination = new PaginationMetadataDto
            {
                TotalItems = meta.TotalItems,
                CurrentPage = meta.CurrentPage,
                PageSize = meta.PageSize,
                TotalPages = meta.TotalPages,
                HasNextPage = meta.HasNextPage,
                HasPreviousPage = meta.HasPreviousPage,
                NextPageUrl = meta.HasNextPage
                    ? uriService.GetPageUri(
                        new PaginationFilter(meta.CurrentPage + 1, meta.PageSize),
                        controllerName, actionName, additionalRouteValues)
                    : null,
                PreviousPageUrl = meta.HasPreviousPage
                    ? uriService.GetPageUri(
                        new PaginationFilter(meta.CurrentPage - 1, meta.PageSize),
                        controllerName, actionName, additionalRouteValues)
                    : null
            }
        };
    }
}
