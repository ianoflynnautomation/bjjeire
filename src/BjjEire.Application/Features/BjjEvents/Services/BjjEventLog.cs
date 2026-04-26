// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.BjjEvents.Services;

internal static partial class BjjEventLog
{
    [LoggerMessage(8001, LogLevel.Debug, "Getting BjjEvent {BjjEventId}")]
    internal static partial void GettingById(ILogger logger, string bjjEventId);

    [LoggerMessage(8011, LogLevel.Information, "BjjEvent inserted {BjjEventId}")]
    internal static partial void Inserted(ILogger logger, string bjjEventId);

    [LoggerMessage(8013, LogLevel.Information, "BjjEvent updated {BjjEventId}")]
    internal static partial void Updated(ILogger logger, string bjjEventId);

    [LoggerMessage(8015, LogLevel.Information, "BjjEvent deleted {BjjEventId}")]
    internal static partial void Deleted(ILogger logger, string bjjEventId);
}
