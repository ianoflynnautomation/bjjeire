// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace BjjEire.Infrastructure.Data.Mongo;

internal static partial class MongoDBContextLog
{
    [LoggerMessage(5101, LogLevel.Error,
        "Invalid repository type for index creation {IndexName} on {CollectionName}")]
    internal static partial void InvalidRepositoryTypeForIndex(ILogger logger, Exception ex, string indexName, string collectionName);

    [LoggerMessage(5102, LogLevel.Error,
        "Failed to delete index {IndexName} from collection {CollectionName}")]
    internal static partial void IndexDeleteFailed(ILogger logger, Exception ex, string indexName, string collectionName);
}
