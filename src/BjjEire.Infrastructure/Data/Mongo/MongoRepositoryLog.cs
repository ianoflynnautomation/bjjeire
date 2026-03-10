using Microsoft.Extensions.Logging;

namespace BjjEire.Infrastructure.Data.Mongo;

internal static partial class MongoRepositoryLog
{
    [LoggerMessage(5001, LogLevel.Warning,
        "Concurrency conflict: entity {EntityId} in collection {CollectionName} was not found for deletion")]
    internal static partial void ConcurrencyConflict(ILogger logger, string entityId, string collectionName);
}
