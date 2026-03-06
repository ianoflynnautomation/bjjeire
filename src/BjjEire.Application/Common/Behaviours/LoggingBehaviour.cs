using System.Diagnostics;
using System.Security.Claims;
using BjjEire.SharedKernel.Logging;
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
        var requestName = typeof(TRequest).Name;
        var responseName = typeof(TResponse).Name;

        string traceId = httpContextAccessor?.HttpContext?.TraceIdentifier ?? "N/A";
        string userId = httpContextAccessor?.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? httpContextAccessor?.HttpContext?.User?.Identity?.Name
                        ?? "Anonymous";

        logger.LogInformation(
            ApplicationLogEvents.RequestHandling.Start,
            "Handling {RequestName}. TraceId: {TraceId}, UserId: {UserId}",
            requestName,
            traceId,
            userId);

        var stopwatch = Stopwatch.StartNew();
        bool success = false;
        try
        {
            TResponse response = await next(cancellationToken);
            success = true;
            return response;
        }
        finally
        {
            stopwatch.Stop();

            if (success)
            {
                logger.LogInformation(
                    ApplicationLogEvents.RequestHandling.Success,
                    "Handled {RequestName}; Returned {ResponseName}; Duration: {DurationMs}ms",
                    requestName, responseName, stopwatch.ElapsedMilliseconds);
            }
            else
            {
                logger.LogWarning(
                    ApplicationLogEvents.RequestHandling.Failure,
                    "Handling {RequestName} failed; Duration: {DurationMs}ms",
                    requestName, stopwatch.ElapsedMilliseconds);
            }
        }
    }
}