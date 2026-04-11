using Microsoft.Extensions.Logging;

namespace BjjEire.Infrastructure.Features.BjjEvents;

internal static partial class BjjEventDeactivationServiceLog
{
    [LoggerMessage(41001, LogLevel.Information,
        "BjjEventDeactivationService started. Interval: {Interval}, InitialDelay: {InitialDelay}")]
    public static partial void ServiceStarted(ILogger logger, TimeSpan interval, TimeSpan initialDelay);

    [LoggerMessage(41002, LogLevel.Information,
        "BjjEvent deactivation sweep complete. Deactivated: {DeactivatedCount}, DurationMs: {DurationMs}")]
    public static partial void SweepCompleted(ILogger logger, long deactivatedCount, long durationMs);

    [LoggerMessage(41003, LogLevel.Error,
        "BjjEvent deactivation sweep failed. The service will retry on the next interval.")]
    public static partial void SweepFailed(ILogger logger, Exception exception);

    [LoggerMessage(41004, LogLevel.Information, "BjjEventDeactivationService stopping.")]
    public static partial void ServiceStopping(ILogger logger);
}
