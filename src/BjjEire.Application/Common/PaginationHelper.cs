using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;

namespace BjjEire.Application.Common;

public static class PaginationHelper
{
    public static async Task<PagedResponse<T>> CreatePagedResponseAsync<T>(
        IQueryable<T> source,
        PaginationFilter filter,
        string controllerName,
        string actionName,
        IUriService uriService,
        IDictionary<string, object?>? additionalRouteValues = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(source, nameof(source));
        ArgumentNullException.ThrowIfNull(filter, nameof(filter));
        ArgumentNullException.ThrowIfNull(controllerName, nameof(controllerName));
        ArgumentNullException.ThrowIfNull(actionName, nameof(actionName));
        ArgumentNullException.ThrowIfNull(uriService, nameof(uriService));

        int totalRecords = await source.CountAsync(cancellationToken);
        var pagedData = await source
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
                NextPageUrl = filter.PageNumber < totalPages
                     ? uriService.GetPageUri(
                         new PaginationFilter(filter.PageNumber + 1, filter.PageSize),
                         controllerName,
                         actionName,
                         additionalRouteValues)
                     : null,
                PreviousPageUrl = filter.PageNumber > 1
                     ? uriService.GetPageUri(
                         new PaginationFilter(filter.PageNumber - 1, filter.PageSize),
                         controllerName,
                         actionName,
                         additionalRouteValues)
                     : null
                // TODO: Optional - FirstPageUrl and LastPageUrl:
                // FirstPageUrl = uriService.GetPageUri(new PaginationFilter(1, filter.PageSize), controllerName, actionName, additionalRouteValues),
                // LastPageUrl = totalPages > 0 ? uriService.GetPageUri(new PaginationFilter(totalPages, filter.PageSize), controllerName, actionName, additionalRouteValues) : null
            }
        };
    }
}