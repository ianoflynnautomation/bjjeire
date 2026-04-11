using Microsoft.Extensions.Logging;

namespace BjjEire.Infrastructure.Features.Competitions;

internal static partial class CompetitionDeactivationServiceLog
{
    [LoggerMessage(40001, LogLevel.Information,
        "CompetitionDeactivationService started. Interval: {Interval}, InitialDelay: {InitialDelay}")]
    public static partial void ServiceStarted(ILogger logger, TimeSpan interval, TimeSpan initialDelay);

    [LoggerMessage(40002, LogLevel.Information,
        "Competition deactivation sweep complete. Deactivated: {DeactivatedCount}, DurationMs: {DurationMs}")]
    public static partial void SweepCompleted(ILogger logger, long deactivatedCount, long durationMs);

    [LoggerMessage(40003, LogLevel.Error,
        "Competition deactivation sweep failed. The service will retry on the next interval.")]
    public static partial void SweepFailed(ILogger logger, Exception exception);

    [LoggerMessage(40004, LogLevel.Information, "CompetitionDeactivationService stopping.")]
    public static partial void ServiceStopping(ILogger logger);
}
