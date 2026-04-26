// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.Application.Common.Exceptions;

public class PipelineException(
    string message,
    string requestName,
    string traceId,
    string userId,
    string requestPath,
    string requestMethod,
    Exception innerException) : Exception(message, innerException)
{
    public string RequestName { get; } = requestName;
    public string TraceId { get; } = traceId;
    public string UserId { get; } = userId;
    public string RequestPath { get; } = requestPath;
    public string RequestMethod { get; } = requestMethod;
}
