// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Common.Behaviours;

internal static partial class LoggingBehaviourLog
{
    [LoggerMessage(9001, LogLevel.Information, "Handling {RequestName}. TraceId: {TraceId}, UserId: {UserId}")]
    internal static partial void Start(ILogger logger, string requestName, string traceId, string userId);

    [LoggerMessage(9002, LogLevel.Information, "Handled {RequestName}; Returned {ResponseName}; Duration: {DurationMs}ms")]
    internal static partial void Success(ILogger logger, string requestName, string responseName, long durationMs);

}
