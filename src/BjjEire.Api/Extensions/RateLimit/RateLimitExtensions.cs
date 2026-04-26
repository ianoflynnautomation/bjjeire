// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Globalization;

namespace BjjEire.Api.Extensions.RateLimit;

public static class RateLimitExtensions
{
    internal static IServiceCollection ConfigureRateLimit(this IServiceCollection services, IConfiguration config)
    {
        _ = services.Configure<RateLimitOptions>(config.GetSection(nameof(RateLimitOptions)));

        _ = services.AddRateLimiter(limiterMiddlewareOptions =>
        {
            limiterMiddlewareOptions.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            {
                RateLimitOptions options = httpContext.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;
                ILogger logger = httpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RateLimitPartition");

                string partitionKey = httpContext.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? httpContext.Connection.RemoteIpAddress?.ToString()
                    ?? "unknown";

                if (!options.EnableRateLimiting)
                {
                    RateLimitLog.GloballyDisabled(logger, partitionKey);
                    return RateLimitPartition.GetNoLimiter(partitionKey);
                }

                RateLimitLog.PartitionConfigured(logger, partitionKey, options.PermitLimit, options.WindowInSeconds);

                return RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey: partitionKey,
                    factory: _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = options.PermitLimit,
                        Window = TimeSpan.FromSeconds(options.WindowInSeconds),
                        SegmentsPerWindow = 5,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    });
            });

            RateLimitOptions initialOptions = config.GetSection(nameof(RateLimitOptions)).Get<RateLimitOptions>() ?? new RateLimitOptions();
            limiterMiddlewareOptions.RejectionStatusCode = initialOptions.EnableRateLimiting
                ? initialOptions.RejectionStatusCode
                : StatusCodes.Status429TooManyRequests;

            limiterMiddlewareOptions.OnRejected = async (rejectionContext, token) =>
            {
                RateLimitOptions options = rejectionContext.HttpContext.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;
                ILogger logger = rejectionContext.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RateLimitRejected");
                string traceId = rejectionContext.HttpContext.TraceIdentifier;
                string requestHost = rejectionContext.HttpContext.Request.Headers.Host.ToString();
                string clientIp = rejectionContext.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
                string userId = rejectionContext.HttpContext.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Anonymous";

                string partitionKey = userId == "Anonymous"
                    ? (clientIp == "Unknown" ? "unknown" : clientIp)
                    : userId;

                RateLimitLog.Rejected(logger, partitionKey, clientIp, userId, options.PermitLimit, traceId);

                rejectionContext.HttpContext.Response.Headers.Append("X-RateLimit-Limit", options.PermitLimit.ToString(CultureInfo.InvariantCulture));
                rejectionContext.HttpContext.Response.Headers.Append("X-RateLimit-Remaining", "0");

                int retryAfterSeconds;
                if (rejectionContext.Lease.TryGetMetadata(MetadataName.RetryAfter, out TimeSpan retryAfter))
                {
                    retryAfterSeconds = (int)retryAfter.TotalSeconds;
                }
                else
                {
                    retryAfterSeconds = options.WindowInSeconds;
                    RateLimitLog.RetryAfterNotFoundWarning(logger, partitionKey, traceId);
                }

                rejectionContext.HttpContext.Response.Headers.RetryAfter =
                    retryAfterSeconds.ToString(CultureInfo.InvariantCulture);
                rejectionContext.HttpContext.Response.Headers.Append(
                    "X-RateLimit-Reset", DateTimeOffset.UtcNow.AddSeconds(retryAfterSeconds).ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture));

                ProblemDetails problemDetails = new()
                {
                    Status = options.RejectionStatusCode,
                    Title = "API Rate Limit Exceeded",
                    Detail = "You have reached the maximum number of requests allowed. Please try again after the specified period.",
                    Type = "urn:bjjeire:rate-limit-exceeded",
                    Instance = traceId
                };

                problemDetails.Extensions["retryAfterSeconds"] = retryAfterSeconds;
                problemDetails.Extensions["limit"] = options.PermitLimit;
                problemDetails.Extensions["windowSeconds"] = options.WindowInSeconds;
                problemDetails.Extensions["resource"] = requestHost;

                if (rejectionContext.HttpContext.Response.HasStarted)
                {
                    RateLimitLog.ResponseStartedWarning(logger, partitionKey, traceId);
                    return;
                }

                try
                {
                    rejectionContext.HttpContext.Response.StatusCode = options.RejectionStatusCode;
                    rejectionContext.HttpContext.Response.ContentType = "application/problem+json";
                    await rejectionContext.HttpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken: token);
                }
                catch (Exception ex)
                {
                    RateLimitLog.RejectionHandlerWriteError(logger, ex, partitionKey, traceId);
                }
            };
        });
        return services;
    }

    internal static IApplicationBuilder UseRateLimit(this IApplicationBuilder app)
    {
        ILogger logger = app.ApplicationServices.GetRequiredService<ILoggerFactory>().CreateLogger("RateLimitSetup");
        RateLimitOptions options = app.ApplicationServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;

        if (options.EnableRateLimiting)
        {
            RateLimitLog.MiddlewareApplied(logger, options.PermitLimit, options.WindowInSeconds, options.RejectionStatusCode);
            _ = app.UseRateLimiter();
        }
        else
        {
            RateLimitLog.MiddlewareSkipped(logger);
        }
        return app;
    }
}
