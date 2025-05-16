using BjjEire.Application.Common.DTOs; // Assuming PagedResponse and PaginationMetadataDto are here
using BjjEire.Application.Common.Interfaces; // Assuming IUriService is here
using BjjEire.Application.Common.Models; // Assuming PaginationFilter is here

namespace BjjEire.Application.Common;

public static class PaginationHelper
{
    public static async Task<PagedResponse<T>> CreatePagedResponseAsync<T>(
        IQueryable<T> source,
        PaginationFilter filter,
        string controllerName,
        string actionName,
        IUriService uriService,
        CancellationToken cancellationToken = default,
        IDictionary<string, object?>? additionalRouteValues = null) // Added for other route/query params
    {
        ArgumentNullException.ThrowIfNull(source, nameof(source));
        ArgumentNullException.ThrowIfNull(filter, nameof(filter));
        ArgumentNullException.ThrowIfNull(controllerName, nameof(controllerName)); // Added check
        ArgumentNullException.ThrowIfNull(actionName, nameof(actionName));       // Added check
        ArgumentNullException.ThrowIfNull(uriService, nameof(uriService));
        // ArgumentNullException.ThrowIfNull(route); // This was causing an error as 'route' is no longer a parameter

        int totalRecords = await source.CountAsync(cancellationToken);
        var pagedData = await source
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        int totalPages = (int)Math.Ceiling(totalRecords / (double)filter.PageSize);

        // Assuming PagedResponse<T> has a Data property that will hold List<T> (pagedData)
        // and Pagination property of type PaginationMetadataDto
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
                        ? uriService.GetPageUri( // This already returns a Uri object
                            new PaginationFilter(filter.PageNumber + 1, filter.PageSize),
                            controllerName,
                            actionName,
                            additionalRouteValues)
                        : null,
                    PreviousPageUrl = filter.PageNumber > 1
                        ? uriService.GetPageUri( // This already returns a Uri object
                            new PaginationFilter(filter.PageNumber - 1, filter.PageSize),
                            controllerName,
                            actionName,
                            additionalRouteValues)
                        : null
                    // Optional FirstPageUrl and LastPageUrl:
                    // FirstPageUrl = uriService.GetPageUri(new PaginationFilter(1, filter.PageSize), controllerName, actionName, additionalRouteValues),
                    // LastPageUrl = totalPages > 0 ? uriService.GetPageUri(new PaginationFilter(totalPages, filter.PageSize), controllerName, actionName, additionalRouteValues) : null
                }
            };
    }
}