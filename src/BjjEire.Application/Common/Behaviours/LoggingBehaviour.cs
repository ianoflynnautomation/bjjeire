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
    where TRequest : IRequest<TResponse> {

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken) {
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
        try {
            TResponse response = await next();
            success = true;
            return response;
        }
#pragma warning disable S2139
        catch (Exception ex) {
            logger.LogDebug(ex,
                       "Exception propagated through LoggingBehaviour for {RequestName}. TraceId: {TraceId}. ExceptionType: {ExceptionType}. Will be handled by other behaviors.",
                       requestName,
                       traceId,
                       ex.GetType().Name);
            throw;
        }
#pragma warning restore S2139
        finally {
            stopwatch.Stop();
            var durationMs = stopwatch.ElapsedMilliseconds;

            if (success) {
                logger.LogInformation(
                    ApplicationLogEvents.RequestHandling.Success,
                    "Handled {RequestName}; Returned {ResponseName}; Duration: {DurationMs}ms; TraceId: {TraceId}; UserId: {UserId}",
                    requestName,
                    responseName,
                    durationMs,
                    traceId,
                    userId);
            }
            else {
                logger.LogWarning(
                    ApplicationLogEvents.RequestHandling.Failure,
                    "Handling {RequestName} failed (an exception was thrown); Duration: {DurationMs}ms; TraceId: {TraceId}; UserId: {UserId}",
                    requestName,
                    durationMs,
                    traceId,
                    userId);
            }
        }
    }
}
