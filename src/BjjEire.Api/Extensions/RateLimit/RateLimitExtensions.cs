using BjjEire.SharedKernel.Logging;

namespace BjjEire.Api.Extensions.RateLimit;

public static class RateLimitExtensions {
    internal static IServiceCollection ConfigureRateLimit(this IServiceCollection services, IConfiguration config) {
        _ = services.Configure<RateLimitOptions>(config.GetSection(nameof(RateLimitOptions)));

        _ = services.AddRateLimiter(limiterMiddlewareOptions => {
            limiterMiddlewareOptions.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext => {
                var appRateLimitOptions = httpContext.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;
                var partitionLogger = httpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RateLimitPartitionFactory");
                var requestHost = httpContext.Request.Headers.Host.ToString();

                if (!appRateLimitOptions.EnableRateLimiting) {
                    partitionLogger.LogWarning(
                        ApplicationLogEvents.RateLimiting.GloballyDisabled,
                        "Rate limiting for Host {RequestHost} is effectively disabled by resolved options (EnableRateLimiting is false). Returning NoLimiter.",
                        requestHost);
                    return RateLimitPartition.GetNoLimiter(requestHost);
                }

                partitionLogger.LogInformation(
                   ApplicationLogEvents.RateLimiting.PartitionConfigured,
                    "RateLimit PartitionFactory for Host {RequestHost}: Using PermitLimit={PermitLimit}, Window={WindowInSeconds}s",
                    requestHost,
                    appRateLimitOptions.PermitLimit,
                    appRateLimitOptions.WindowInSeconds);

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: requestHost,
                    factory: _ => new FixedWindowRateLimiterOptions {
                        PermitLimit = appRateLimitOptions.PermitLimit,
                        Window = TimeSpan.FromSeconds(appRateLimitOptions.WindowInSeconds),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0 // No queueing, reject immediately if limit is reached
                    });
            });

            var initialAppRateLimitOptions = config.GetSection(nameof(RateLimitOptions)).Get<RateLimitOptions>()
                                            ?? new RateLimitOptions();

            limiterMiddlewareOptions.RejectionStatusCode = initialAppRateLimitOptions.EnableRateLimiting
                                                            ? initialAppRateLimitOptions.RejectionStatusCode
                                                            : StatusCodes.Status429TooManyRequests;

            var startupLogger = services.BuildServiceProvider().GetRequiredService<ILoggerFactory>().CreateLogger("RateLimitConfiguration"); // Temporary logger for startup phase
            startupLogger.LogInformation(ApplicationLogEvents.RateLimiting.RejectionStatusCodeSet,
                "Rate limiting RejectionStatusCode configured to {RejectionStatusCode}. Initial EnableRateLimiting: {IsEnabled}",
                limiterMiddlewareOptions.RejectionStatusCode, initialAppRateLimitOptions.EnableRateLimiting);


            limiterMiddlewareOptions.OnRejected = async (rejectionContext, token) => {
                var currentAppRateLimitOptions = rejectionContext.HttpContext.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;
                var onRejectedLogger = rejectionContext.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RateLimitOnRejectedHandler");
                var traceId = rejectionContext.HttpContext.TraceIdentifier;
                var requestHost = rejectionContext.HttpContext.Request.Headers.Host.ToString();
                var clientIp = rejectionContext.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
                var userId = rejectionContext.HttpContext.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Anonymous";


                onRejectedLogger.LogInformation(ApplicationLogEvents.RateLimiting.Rejected,
                    "Rate limit EXCEEDED for Host {RequestHost}, ClientIP: {ClientIP}, UserId: {UserId}. Effective PermitLimit: {PermitLimit}. TraceId: {TraceId}",
                    requestHost, clientIp, userId, currentAppRateLimitOptions.PermitLimit, traceId);

                rejectionContext.HttpContext.Response.Headers.Append("X-RateLimit-Limit", currentAppRateLimitOptions.PermitLimit.ToString());
                onRejectedLogger.LogDebug(ApplicationLogEvents.RateLimiting.HeadersSetDebug, "Set X-RateLimit-Limit to {Limit}. TraceId: {TraceId}", currentAppRateLimitOptions.PermitLimit, traceId);

                rejectionContext.HttpContext.Response.Headers.Append("X-RateLimit-Remaining", "0");
                onRejectedLogger.LogDebug(ApplicationLogEvents.RateLimiting.HeadersSetDebug, "Set X-RateLimit-Remaining to 0. TraceId: {TraceId}", traceId);

                string? retryAfterHeaderValueString = null;
                if (rejectionContext.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfterTimeSpan)) {
                    var resetTime = DateTimeOffset.UtcNow.Add(retryAfterTimeSpan);
                    rejectionContext.HttpContext.Response.Headers.Append("X-RateLimit-Reset", resetTime.ToUnixTimeSeconds().ToString());
                    retryAfterHeaderValueString = ((int)retryAfterTimeSpan.TotalSeconds).ToString();
                    onRejectedLogger.LogInformation(ApplicationLogEvents.RateLimiting.RetryAfterFound,
                                             "RetryAfter metadata found: {RetryAfterValue}s. Set X-RateLimit-Reset to {ResetTimestamp}. TraceId: {TraceId}",
                                             retryAfterHeaderValueString, resetTime.ToUnixTimeSeconds(), traceId);
                }
                else {
                    onRejectedLogger.LogWarning(ApplicationLogEvents.RateLimiting.RetryAfterNotFoundWarning,
                                            "RetryAfter metadata was NOT found on the rejected lease for Host {RequestHost}. TraceId: {TraceId}", requestHost, traceId);
                }

                var problemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails {
                    Status = currentAppRateLimitOptions.RejectionStatusCode,
                    Title = "API Rate Limit Exceeded",
                    Detail = $"You have reached the maximum number of requests allowed. Please try again after the specified period.",
                    Type = "urn:bjjeire:rate-limit-exceeded",
                    Instance = traceId
                };

                if (retryAfterHeaderValueString != null) {
                    problemDetails.Extensions["retryAfterSeconds"] = int.Parse(retryAfterHeaderValueString);
                }
                problemDetails.Extensions["limit"] = currentAppRateLimitOptions.PermitLimit;
                problemDetails.Extensions["windowSeconds"] = currentAppRateLimitOptions.WindowInSeconds;
                problemDetails.Extensions["resource"] = requestHost;

                onRejectedLogger.LogInformation(ApplicationLogEvents.RateLimiting.ProblemDetailsSummary,
                    "Rate limit rejection ProblemDetails: Status={Status}, Title='{Title}', RetryAfter={RetryAfter}, Limit={Limit}, Window={Window}, Resource={Resource}. TraceId: {TraceId}",
                    problemDetails.Status, problemDetails.Title, retryAfterHeaderValueString ?? "N/A",
                    currentAppRateLimitOptions.PermitLimit, currentAppRateLimitOptions.WindowInSeconds, requestHost, traceId);

                onRejectedLogger.LogDebug(ApplicationLogEvents.RateLimiting.ProblemDetailsJsonDebug,
                    "Rate limit rejection ProblemDetails JSON: {ProblemDetailsJson}. TraceId: {TraceId}",
                    JsonSerializer.Serialize(problemDetails), traceId);

                if (rejectionContext.HttpContext.Response.HasStarted) {
                    onRejectedLogger.LogWarning(ApplicationLogEvents.RateLimiting.ResponseStartedWarning,
                        "Response has already started for Host {RequestHost} before attempting to write ProblemDetails. TraceId: {TraceId}", requestHost, traceId);
                    return;
                }

                try {
                    rejectionContext.HttpContext.Response.StatusCode = currentAppRateLimitOptions.RejectionStatusCode;
                    rejectionContext.HttpContext.Response.ContentType = "application/problem+json";
                    await rejectionContext.HttpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken: token);
                    onRejectedLogger.LogInformation(ApplicationLogEvents.RateLimiting.RejectionSent,
                        "Successfully wrote rate limit rejection (ProblemDetails) to response for Host {RequestHost}. TraceId: {TraceId}", requestHost, traceId);
                }
                catch (Exception ex) {
                    onRejectedLogger.LogError(ApplicationLogEvents.RateLimiting.RejectionHandlerWriteError, ex,
                        "Failed to write ProblemDetails to response in OnRejected callback for Host {RequestHost}. TraceId: {TraceId}", requestHost, traceId);
                }
            };
        });
        return services;
    }

    internal static IApplicationBuilder UseRateLimit(this IApplicationBuilder app) {
        var logger = app.ApplicationServices.GetRequiredService<ILoggerFactory>().CreateLogger("RateLimitMiddlewareSetup");
        var optionsFromDI = app.ApplicationServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;

        if (optionsFromDI.EnableRateLimiting) {
            logger.LogInformation(
                ApplicationLogEvents.RateLimiting.MiddlewareApplied,
                "Applying ASP.NET Core RateLimiter middleware. Effective Options: PermitLimit={PermitLimit}, Window={WindowInSeconds}s, RejectionCode={RejectionCode}",
                optionsFromDI.PermitLimit,
                optionsFromDI.WindowInSeconds,
                optionsFromDI.RejectionStatusCode);
            _ = app.UseRateLimiter();
        }
        else {
            logger.LogWarning(ApplicationLogEvents.RateLimiting.MiddlewareSkipped, "ASP.NET Core RateLimiter middleware SKIPPED as EnableRateLimiting is false in resolved options.");
        }
        return app;
    }
}
