using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Gyms.Queries;

internal static partial class GetGymPaginationQueryHandlerLog
{
    [LoggerMessage(10001, LogLevel.Debug,
        "Handling {QueryName}. Page: {PageNumber}, PageSize: {PageSize}, County: {County}, CacheKey: {CacheKey}")]
    internal static partial void QueryStart(
        ILogger logger, string queryName, int pageNumber, int pageSize, string county, string cacheKey);

    [LoggerMessage(10002, LogLevel.Debug, "Cache miss for {CacheKey}. Fetching Gyms from repository.")]
    internal static partial void CacheMiss(ILogger logger, string cacheKey);

    [LoggerMessage(10004, LogLevel.Debug,
        "Handled {QueryName}. Returned {ReturnedCount} gyms for Page {PageNumber} (Total: {TotalRecords}). CacheKey: {CacheKey}")]
    internal static partial void QuerySuccess(
        ILogger logger, string queryName, int returnedCount, int pageNumber, int totalRecords, string cacheKey);
}
