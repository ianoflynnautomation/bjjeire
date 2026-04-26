// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace BjjEire.Infrastructure.Features.Common;

internal static partial class PeriodicDeactivationServiceLog
{
    [LoggerMessage(42001, LogLevel.Information,
        "PeriodicDeactivationService<{EntityName}> started. Interval: {Interval}, InitialDelay: {InitialDelay}")]
    public static partial void ServiceStarted(ILogger logger, string entityName, TimeSpan interval, TimeSpan initialDelay);

    [LoggerMessage(42002, LogLevel.Information,
        "{EntityName} deactivation sweep complete. Deactivated: {DeactivatedCount}, DurationMs: {DurationMs}")]
    public static partial void SweepCompleted(ILogger logger, string entityName, long deactivatedCount, long durationMs);

    [LoggerMessage(42003, LogLevel.Error,
        "{EntityName} deactivation sweep failed. The service will retry on the next interval.")]
    public static partial void SweepFailed(ILogger logger, string entityName, Exception exception);

    [LoggerMessage(42004, LogLevel.Information,
        "PeriodicDeactivationService<{EntityName}> stopping.")]
    public static partial void ServiceStopping(ILogger logger, string entityName);
}
