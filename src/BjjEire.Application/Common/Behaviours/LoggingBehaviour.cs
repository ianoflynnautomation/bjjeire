// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

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
    var requestName = typeof(TRequest).Name;
    var responseName = typeof(TResponse).Name;
    var traceId = httpContextAccessor?.HttpContext?.TraceIdentifier ?? "N/A";
    var userId = httpContextAccessor?.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? httpContextAccessor?.HttpContext?.User?.Identity?.Name
                    ?? "Anonymous";

    logger.LogInformation(
        ApplicationLogEvents.RequestHandling.Start,
        "Handling {RequestName}. TraceId: {TraceId}, UserId: {UserId}",
        requestName,
        traceId,
        userId);

    var stopwatch = Stopwatch.StartNew();
    TResponse response = default!;
    bool success = false;

    try
    {
      response = await next();
      success = true;
      return response;
    }
    catch (Exception ex)
    {
      logger.LogDebug("Exception propagated through LoggingBehaviour for {RequestName}. TraceId: {TraceId}. ExceptionType: {ExceptionType}. Will be handled by other behaviors.",
                       requestName, traceId, ex.GetType().Name);
      throw;
    }
    finally
    {
      stopwatch.Stop();
      var durationMs = stopwatch.ElapsedMilliseconds;

      if (success)
      {
        logger.LogInformation(
            ApplicationLogEvents.RequestHandling.Success,
            "Handled {RequestName}; Rerturned {ResponseName}; Duration: {DurationMs}ms; TraceId: {TraceId}; UserId: {UserId}",
            requestName,
            responseName,
            durationMs,
            traceId,
            userId);
      }
      else
      {
        logger.LogWarning(
            ApplicationLogEvents.RequestHandling.Failure,
            "Handling {RequestName} failed (threw exception); Duration: {DurationMs}ms; TraceId: {TraceId}; UserId: {UserId}",
            requestName,
            durationMs,
            traceId,
            userId);
      }

      // --- Logging Response Content ---
      // Similar to requests, logging entire response objects is risky.
      // This generic behavior omits response content logging.
    }
  }
}
