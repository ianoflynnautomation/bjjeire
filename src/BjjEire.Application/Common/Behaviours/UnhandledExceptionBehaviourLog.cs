// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Common.Behaviours;

internal static partial class UnhandledExceptionBehaviourLog
{
    [LoggerMessage(1001, LogLevel.Error,
        "Unhandled exception for {RequestName}. Path: {RequestPath}, Method: {RequestMethod}")]
    internal static partial void UnhandledException(
        ILogger logger, Exception ex, string requestName, string requestPath, string requestMethod);
}
