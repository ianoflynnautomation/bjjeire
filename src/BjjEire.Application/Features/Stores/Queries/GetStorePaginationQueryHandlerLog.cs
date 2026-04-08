
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Stores.Queries;

internal static partial class GetStorePaginationQueryHandlerLog
{
    [LoggerMessage(40001, LogLevel.Debug,
        "Handling {QueryName}. Page: {PageNumber}, PageSize: {PageSize}, CacheKey: {CacheKey}")]
    internal static partial void QueryStart(
        ILogger logger, string queryName, int pageNumber, int pageSize, string cacheKey);

    [LoggerMessage(40002, LogLevel.Debug, "Cache miss for {CacheKey}. Fetching Stores from repository.")]
    internal static partial void CacheMiss(ILogger logger, string cacheKey);

    [LoggerMessage(40004, LogLevel.Debug,
        "Handled {QueryName}. Returned {ReturnedCount} items for Page {PageNumber} (Total: {TotalRecords}). CacheKey: {CacheKey}")]
    internal static partial void QuerySuccess(
        ILogger logger, string queryName, int returnedCount, int pageNumber, int totalRecords, string cacheKey);
}
