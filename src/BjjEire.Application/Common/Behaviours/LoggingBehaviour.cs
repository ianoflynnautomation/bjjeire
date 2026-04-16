using System.Diagnostics;
using System.Security.Claims;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Common.Behaviours;

public class LoggingBehaviour<TRequest, TResponse>(
    ILogger<LoggingBehaviour<TRequest, TResponse>> logger,
    IHttpContextAccessor? httpContextAccessor = null)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(next);

        string requestName = typeof(TRequest).Name;
        string responseName = typeof(TResponse).Name;

        string traceId = Activity.Current?.TraceId.ToString()
            ?? httpContextAccessor?.HttpContext?.TraceIdentifier
            ?? "N/A";

        string userId = httpContextAccessor?.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? httpContextAccessor?.HttpContext?.User?.Identity?.Name
                        ?? "Anonymous";

        LoggingBehaviourLog.Start(logger, requestName, traceId, userId);

        Stopwatch stopwatch = Stopwatch.StartNew();
        TResponse response = await next(cancellationToken);
        stopwatch.Stop();
        LoggingBehaviourLog.Success(logger, requestName, responseName, stopwatch.ElapsedMilliseconds);
        return response;
    }
}
