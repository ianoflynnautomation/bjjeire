using System.Diagnostics;
using System.Security.Claims;
using BjjEire.SharedKernel.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Common.Behaviours;

public class ValidationBehaviour<TRequest, TResponse>(
    IEnumerable<IValidator<TRequest>> validators,
    ILogger<ValidationBehaviour<TRequest, TResponse>> logger,
    IHttpContextAccessor httpContextAccessor) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull {
    private readonly IEnumerable<IValidator<TRequest>> _validators = validators;
    private readonly ILogger<ValidationBehaviour<TRequest, TResponse>> _logger = logger;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(next);

        var stopwatch = Stopwatch.StartNew();
        var requestName = typeof(TRequest).Name;

        var httpContext = _httpContextAccessor.HttpContext;
        var aspNetCoreTraceId = httpContext?.TraceIdentifier ?? Guid.NewGuid().ToString();
        var userId = httpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? httpContext?.User?.Identity?.Name
                     ?? "Anonymous";

        _logger.LogInformation(
            ApplicationLogEvents.Validation.ProcessStart,
            "Starting validation for {RequestName}. ASP.NET Core TraceId: {AspNetCoreTraceId}, UserId: {UserId}",
            requestName, aspNetCoreTraceId, userId);

        if (!_validators.Any()) {
            stopwatch.Stop();
            _logger.LogInformation(
                ApplicationLogEvents.Validation.NoValidatorsFound,
                "No validators configured for {RequestName}. Skipping validation. ASP.NET Core TraceId: {AspNetCoreTraceId}, UserId: {UserId}, DurationMs: {DurationMs}",
                requestName, aspNetCoreTraceId, userId, stopwatch.ElapsedMilliseconds);
            return await next(cancellationToken);
        }

        var context = new ValidationContext<TRequest>(request);
        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = validationResults
            .Where(r => r is { IsValid: false })
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        stopwatch.Stop();

        if (failures.Count != 0) {
            var errorsSummary = string.Join("; ", failures.Select(f => $"{f.PropertyName}: {f.ErrorMessage}"));
            _logger.LogWarning(
                ApplicationLogEvents.Validation.Failed,
                "Validation failed for {RequestName}. ASP.NET Core TraceId: {AspNetCoreTraceId}, UserId: {UserId}, ErrorCount: {ErrorCount}, Errors: \"{ErrorsSummary}\", DurationMs: {DurationMs}",
                requestName,
                aspNetCoreTraceId,
                userId,
                failures.Count,
                errorsSummary,
                stopwatch.ElapsedMilliseconds);

            throw new ValidationException(failures);
        }

        _logger.LogInformation(
            ApplicationLogEvents.Validation.Succeeded,
            "Validation succeeded for {RequestName}. ASP.NET Core TraceId: {AspNetCoreTraceId}, UserId: {UserId}, DurationMs: {DurationMs}",
            requestName, aspNetCoreTraceId, userId, stopwatch.ElapsedMilliseconds);

        return await next(cancellationToken);
    }
}
