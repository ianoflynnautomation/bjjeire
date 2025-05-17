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
        if (!_validators.Any()) {
            ArgumentNullException.ThrowIfNull(next);
            return await next(cancellationToken);
        }

        var httpContext = _httpContextAccessor.HttpContext;
        var traceId = httpContext?.TraceIdentifier ?? Guid.NewGuid().ToString();
        //var userId = httpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Anonymous";
        var requestName = typeof(TRequest).Name;

        var context = new ValidationContext<TRequest>(request);
        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = validationResults
            .Where(r => !r.IsValid)
            .SelectMany(r => r.Errors)
            .ToList();

        if (failures.Count != 0) {
            // Log validation failures
            _logger.LogWarning(
                "Validation failed for request {RequestName}. TraceId: {TraceId}, UserId: {UserId}, Errors: {Errors}",
                requestName,
                traceId,
                "",//userId,
                string.Join("; ", failures.Select(f => $"{f.PropertyName}: {f.ErrorMessage}")));

            throw new ValidationException(failures);
        }
        ArgumentNullException.ThrowIfNull(next);
        return await next();
    }
}