using System.Diagnostics;
using System.Security.Claims;
using BjjEire.SharedKernel.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Common.Behaviours;

public class UnhandledExceptionBehaviour<TRequest, TResponse>(
    ILogger<UnhandledExceptionBehaviour<TRequest, TResponse>> logger,
    IHttpContextAccessor httpContextAccessor)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
  private readonly ILogger<UnhandledExceptionBehaviour<TRequest, TResponse>> _logger = logger;
  private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

  public async Task<TResponse> Handle(
      TRequest request,
      RequestHandlerDelegate<TResponse> next,
      CancellationToken cancellationToken)
  {
    ArgumentNullException.ThrowIfNull(next);

    var stopwatch = Stopwatch.StartNew();
    var requestName = typeof(TRequest).Name;

    var httpContext = _httpContextAccessor.HttpContext;
    var aspNetCoreTraceId = httpContext?.TraceIdentifier ?? "N/A";
    var requestPath = httpContext?.Request.Path.Value ?? "Unknown";
    var requestMethod = httpContext?.Request.Method ?? "Unknown";
    var userId = httpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? httpContext?.User?.Identity?.Name
                 ?? "Anonymous";

    _logger.LogInformation(
        ApplicationLogEvents.UnhandledExceptions.PipelineProcessingStartInfo,
        "Starting MediatR request pipeline for {RequestName}. Path: {RequestPath}, Method: {RequestMethod}, ASP.NET Core TraceId: {AspNetCoreTraceId}, UserId: {UserId}",
        requestName, requestPath, requestMethod, aspNetCoreTraceId, userId);

    try
    {
      return await next(cancellationToken);
    }
    catch (Exception ex)
    {
      _logger.LogError(ApplicationLogEvents.UnhandledExceptions.HandleExceptionError, ex,
          "Unhandled exception for {RequestName}. Path: {RequestPath}, Method: {RequestMethod}, ASP.NET Core TraceId: {AspNetCoreTraceId}, UserId: {UserId}",
          requestName,
          requestPath,
          requestMethod,
          aspNetCoreTraceId,
          userId);

      throw;
    }
    finally
    {
      stopwatch.Stop();
      _logger.LogInformation(
          ApplicationLogEvents.UnhandledExceptions.PipelineProcessingEndInfo,
          "Finished MediatR request pipeline for {RequestName}. Path: {RequestPath}, Method: {RequestMethod}, ASP.NET Core TraceId: {AspNetCoreTraceId}, UserId: {UserId}, DurationMs: {DurationMs}",
          requestName, requestPath, requestMethod, aspNetCoreTraceId, userId, stopwatch.ElapsedMilliseconds);
    }
  }
}
