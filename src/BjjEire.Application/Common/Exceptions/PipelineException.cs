
namespace BjjEire.Application.Common.Exceptions;

public class PipelineException : Exception {
    public string RequestName { get; }
    public string TraceId { get; }
    public string UserId { get; }
    public string RequestPath { get; }
    public string RequestMethod { get; }

    public PipelineException(
        string message,
        string requestName,
        string traceId,
        string userId,
        string requestPath,
        string requestMethod,
        Exception innerException)
        : base(message, innerException) {
        RequestName = requestName;
        TraceId = traceId;
        UserId = userId;
        RequestPath = requestPath;
        RequestMethod = requestMethod;
    }
}