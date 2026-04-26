// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.Extensions.RateLimit;

internal static partial class RateLimitLog
{
    [LoggerMessage(13001, LogLevel.Warning, "Rate limiting globally disabled for PartitionKey {PartitionKey}.")]
    internal static partial void GloballyDisabled(ILogger logger, string partitionKey);

    [LoggerMessage(13002, LogLevel.Information,
        "RateLimit partition configured for PartitionKey {PartitionKey}: PermitLimit={PermitLimit}, Window={WindowInSeconds}s")]
    internal static partial void PartitionConfigured(ILogger logger, string partitionKey, int permitLimit, int windowInSeconds);

    [LoggerMessage(13004, LogLevel.Information,
        "RateLimiter middleware applied. PermitLimit={PermitLimit}, Window={WindowInSeconds}s, RejectionCode={RejectionCode}")]
    internal static partial void MiddlewareApplied(ILogger logger, int permitLimit, int windowInSeconds, int rejectionCode);

    [LoggerMessage(13005, LogLevel.Warning, "RateLimiter middleware skipped — EnableRateLimiting is false.")]
    internal static partial void MiddlewareSkipped(ILogger logger);

    [LoggerMessage(13101, LogLevel.Information,
        "Rate limit exceeded. PartitionKey: {PartitionKey}, IP: {ClientIp}, User: {UserId}, Limit: {PermitLimit}. TraceId: {TraceId}")]
    internal static partial void Rejected(ILogger logger, string partitionKey, string clientIp, string userId, int permitLimit, string traceId);

    [LoggerMessage(13104, LogLevel.Warning,
        "RetryAfter metadata not found for PartitionKey {PartitionKey}. TraceId: {TraceId}")]
    internal static partial void RetryAfterNotFoundWarning(ILogger logger, string partitionKey, string traceId);

    [LoggerMessage(13107, LogLevel.Warning,
        "Response already started for PartitionKey {PartitionKey}. TraceId: {TraceId}")]
    internal static partial void ResponseStartedWarning(ILogger logger, string partitionKey, string traceId);

    [LoggerMessage(13110, LogLevel.Error,
        "Failed to write rate limit rejection response for PartitionKey {PartitionKey}. TraceId: {TraceId}")]
    internal static partial void RejectionHandlerWriteError(ILogger logger, Exception ex, string partitionKey, string traceId);
}
