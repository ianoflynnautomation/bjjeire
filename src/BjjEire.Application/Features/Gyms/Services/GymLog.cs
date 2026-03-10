using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Gyms.Services;

internal static partial class GymLog
{
    [LoggerMessage(15101, LogLevel.Debug, "Getting Gym {GymId}")]
    internal static partial void GettingById(ILogger logger, string gymId);

    [LoggerMessage(15111, LogLevel.Information, "Gym inserted {GymId}")]
    internal static partial void Inserted(ILogger logger, string gymId);

    [LoggerMessage(15113, LogLevel.Information, "Gym updated {GymId}")]
    internal static partial void Updated(ILogger logger, string gymId);

    [LoggerMessage(15115, LogLevel.Information, "Gym deleted {GymId}")]
    internal static partial void Deleted(ILogger logger, string gymId);
}
