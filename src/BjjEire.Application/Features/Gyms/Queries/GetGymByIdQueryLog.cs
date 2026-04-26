// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Gyms.Queries;

internal static partial class GetGymByIdQueryLog
{
    [LoggerMessage(12001, LogLevel.Information,
        "Fetching gym by id {GymId}, cache key {CacheKey}")]
    internal static partial void FetchById(ILogger logger, string gymId, string cacheKey);
}
