using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Common.Queries;

internal static partial class PaginatedQueryLog
{
    [LoggerMessage(11001, LogLevel.Debug,
        "Handling paginated query for {EntityName}. Page: {PageNumber}, PageSize: {PageSize}, CacheKey: {CacheKey}")]
    internal static partial void QueryStart(
        ILogger logger, string entityName, int pageNumber, int pageSize, string cacheKey);

    [LoggerMessage(11002, LogLevel.Debug,
        "Cache miss for {CacheKey}. Fetching {EntityName} from repository.")]
    internal static partial void CacheMiss(ILogger logger, string entityName, string cacheKey);

    [LoggerMessage(11003, LogLevel.Debug,
        "Handled paginated query for {EntityName}. Returned {ReturnedCount} items for Page {PageNumber} (Total: {TotalRecords}). CacheKey: {CacheKey}")]
    internal static partial void QuerySuccess(
        ILogger logger, string entityName, int returnedCount, int pageNumber, int totalRecords, string cacheKey);
}
