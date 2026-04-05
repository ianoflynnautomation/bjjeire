using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Competitions.Queries;

internal static partial class GetCompetitionPaginationQueryHandlerLog
{
    [LoggerMessage(30001, LogLevel.Debug,
        "Handling {QueryName}. Page: {PageNumber}, PageSize: {PageSize}, Organisation: {Organisation}, CacheKey: {CacheKey}")]
    internal static partial void QueryStart(
        ILogger logger, string queryName, int pageNumber, int pageSize, string organisation, string cacheKey);

    [LoggerMessage(30002, LogLevel.Debug, "Cache miss for {CacheKey}. Fetching competitions from repository.")]
    internal static partial void CacheMiss(ILogger logger, string cacheKey);

    [LoggerMessage(30004, LogLevel.Debug,
        "Handled {QueryName}. Returned {ReturnedCount} items for Page {PageNumber} (Total: {TotalRecords}). CacheKey: {CacheKey}")]
    internal static partial void QuerySuccess(
        ILogger logger, string queryName, int returnedCount, int pageNumber, int totalRecords, string cacheKey);
}
