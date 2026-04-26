// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Common.Behaviours;

internal static partial class ValidationBehaviourLog
{
    [LoggerMessage(2004, LogLevel.Warning,
        "Validation failed for {RequestName}. ErrorCount: {ErrorCount}, Errors: \"{ErrorsSummary}\"")]
    internal static partial void ValidationFailed(
        ILogger logger, string requestName, int errorCount, string errorsSummary);
}
