// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.BjjEvents.Queries;

internal static partial class GetBjjEventByIdQueryLog
{
    [LoggerMessage(12002, LogLevel.Information,
        "Fetching BJJ event by id {BjjEventId}, cache key {CacheKey}")]
    internal static partial void FetchById(ILogger logger, string bjjEventId, string cacheKey);
}
