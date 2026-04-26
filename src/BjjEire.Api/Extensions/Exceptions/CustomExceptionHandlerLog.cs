// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.Extensions.Exceptions;

internal static partial class CustomExceptionHandlerLog
{
    [LoggerMessage(3001, LogLevel.Error,
        "Exception handled. ExceptionType: {ExceptionType}, Message: \"{ExceptionMessage}\", UserId: {UserId}, Request: {RequestMethod} {RequestPath}, Status: {ResponseStatus}, Title: \"{ResponseTitle}\", TraceId: {TraceId}")]
    internal static partial void ExceptionHandledError(
        ILogger logger, Exception ex,
        string exceptionType, string exceptionMessage, string userId,
        string requestMethod, string requestPath, int? responseStatus, string? responseTitle, string traceId);

    [LoggerMessage(3002, LogLevel.Warning,
        "Exception handled. ExceptionType: {ExceptionType}, Message: \"{ExceptionMessage}\", UserId: {UserId}, Request: {RequestMethod} {RequestPath}, Status: {ResponseStatus}, Title: \"{ResponseTitle}\", TraceId: {TraceId}")]
    internal static partial void ExceptionHandledWarning(
        ILogger logger, Exception ex,
        string exceptionType, string exceptionMessage, string userId,
        string requestMethod, string requestPath, int? responseStatus, string? responseTitle, string traceId);
}
