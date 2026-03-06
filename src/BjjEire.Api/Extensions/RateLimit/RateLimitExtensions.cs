using BjjEire.SharedKernel.Logging;

namespace BjjEire.Api.Extensions.RateLimit;

public static class RateLimitExtensions {
    internal static IServiceCollection ConfigureRateLimit(this IServiceCollection services, IConfiguration config) {
        _ = services.Configure<RateLimitOptions>(config.GetSection(nameof(RateLimitOptions)));

        _ = services.AddRateLimiter(limiterMiddlewareOptions => {
            limiterMiddlewareOptions.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext => {
                var options = httpContext.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;
                var logger = httpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RateLimitPartition");
                var requestHost = httpContext.Request.Headers.Host.ToString();

                if (!options.EnableRateLimiting) {
                    logger.LogWarning(ApplicationLogEvents.RateLimiting.GloballyDisabled,
                        "Rate limiting disabled for Host {RequestHost}.", requestHost);
                    return RateLimitPartition.GetNoLimiter(requestHost);
                }

                logger.LogInformation(ApplicationLogEvents.RateLimiting.PartitionConfigured,
                    "RateLimit for Host {RequestHost}: PermitLimit={PermitLimit}, Window={WindowInSeconds}s",
                    requestHost, options.PermitLimit, options.WindowInSeconds);

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: requestHost,
                    factory: _ => new FixedWindowRateLimiterOptions {
                        PermitLimit = options.PermitLimit,
                        Window = TimeSpan.FromSeconds(options.WindowInSeconds),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    });
            });

            var initialOptions = config.GetSection(nameof(RateLimitOptions)).Get<RateLimitOptions>() ?? new RateLimitOptions();
            limiterMiddlewareOptions.RejectionStatusCode = initialOptions.EnableRateLimiting
                ? initialOptions.RejectionStatusCode
                : StatusCodes.Status429TooManyRequests;

            limiterMiddlewareOptions.OnRejected = async (rejectionContext, token) => {
                var options = rejectionContext.HttpContext.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;
                var logger = rejectionContext.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RateLimitRejected");
                var traceId = rejectionContext.HttpContext.TraceIdentifier;
                var requestHost = rejectionContext.HttpContext.Request.Headers.Host.ToString();
                var clientIp = rejectionContext.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
                var userId = rejectionContext.HttpContext.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Anonymous";

                logger.LogInformation(ApplicationLogEvents.RateLimiting.Rejected,
                    "Rate limit exceeded for Host {RequestHost}, IP: {ClientIP}, User: {UserId}, Limit: {PermitLimit}. TraceId: {TraceId}",
                    requestHost, clientIp, userId, options.PermitLimit, traceId);

                rejectionContext.HttpContext.Response.Headers.Append("X-RateLimit-Limit", options.PermitLimit.ToString());
                rejectionContext.HttpContext.Response.Headers.Append("X-RateLimit-Remaining", "0");

                int? retryAfterSeconds = null;
                if (rejectionContext.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)) {
                    retryAfterSeconds = (int)retryAfter.TotalSeconds;
                    rejectionContext.HttpContext.Response.Headers.Append(
                        "X-RateLimit-Reset", DateTimeOffset.UtcNow.Add(retryAfter).ToUnixTimeSeconds().ToString());
                }
                else {
                    logger.LogWarning(ApplicationLogEvents.RateLimiting.RetryAfterNotFoundWarning,
                        "RetryAfter metadata not found for Host {RequestHost}. TraceId: {TraceId}", requestHost, traceId);
                }

                var problemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails {
                    Status = options.RejectionStatusCode,
                    Title = "API Rate Limit Exceeded",
                    Detail = "You have reached the maximum number of requests allowed. Please try again after the specified period.",
                    Type = "urn:bjjeire:rate-limit-exceeded",
                    Instance = traceId
                };

                if (retryAfterSeconds.HasValue) problemDetails.Extensions["retryAfterSeconds"] = retryAfterSeconds.Value;
                problemDetails.Extensions["limit"] = options.PermitLimit;
                problemDetails.Extensions["windowSeconds"] = options.WindowInSeconds;
                problemDetails.Extensions["resource"] = requestHost;

                if (rejectionContext.HttpContext.Response.HasStarted) {
                    logger.LogWarning(ApplicationLogEvents.RateLimiting.ResponseStartedWarning,
                        "Response already started for Host {RequestHost}. TraceId: {TraceId}", requestHost, traceId);
                    return;
                }

                try {
                    rejectionContext.HttpContext.Response.StatusCode = options.RejectionStatusCode;
                    rejectionContext.HttpContext.Response.ContentType = "application/problem+json";
                    await rejectionContext.HttpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken: token);
                }
                catch (Exception ex) {
                    logger.LogError(ApplicationLogEvents.RateLimiting.RejectionHandlerWriteError, ex,
                        "Failed to write rate limit rejection for Host {RequestHost}. TraceId: {TraceId}", requestHost, traceId);
                }
            };
        });
        return services;
    }

    internal static IApplicationBuilder UseRateLimit(this IApplicationBuilder app) {
        var logger = app.ApplicationServices.GetRequiredService<ILoggerFactory>().CreateLogger("RateLimitSetup");
        var options = app.ApplicationServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;

        if (options.EnableRateLimiting) {
            logger.LogInformation(ApplicationLogEvents.RateLimiting.MiddlewareApplied,
                "RateLimiter middleware applied. PermitLimit={PermitLimit}, Window={WindowInSeconds}s, RejectionCode={RejectionCode}",
                options.PermitLimit, options.WindowInSeconds, options.RejectionStatusCode);
            _ = app.UseRateLimiter();
        }
        else {
            logger.LogWarning(ApplicationLogEvents.RateLimiting.MiddlewareSkipped,
                "RateLimiter middleware skipped — EnableRateLimiting is false.");
        }
        return app;
    }
}
