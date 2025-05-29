// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text.Json; // For JsonSerializer (logging ProblemDetails)

namespace BjjEire.Api.Extensions.RateLimit;

public static class RateLimitExtensions
{
    internal static IServiceCollection ConfigureRateLimit(this IServiceCollection services, IConfiguration config)
    {
        // This initial Configure is still good for non-test scenarios where options come from appsettings.json.
        // For tests, CustomApiFactory.ConfigureServices will override IOptions<RateLimitOptions>.
        services.Configure<RateLimitOptions>(config.GetSection(nameof(RateLimitOptions)));

        _ = services.AddRateLimiter(limiterMiddlewareOptions => // This is Microsoft.AspNetCore.RateLimiting.RateLimiterOptions
        {
            // Setup GlobalLimiter and OnRejected using IServiceProvider to resolve the *actual* (possibly test-overridden)
            // BjjEire.Api.Extensions.RateLimit.RateLimitOptions at runtime.

            limiterMiddlewareOptions.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            {
                var appRateLimitOptions = httpContext.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;
                var partitionLogger = httpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RateLimitPartitionFactory");

                if (!appRateLimitOptions.EnableRateLimiting)
                {
                    partitionLogger.LogWarning(
                        "Rate limiting for Host {Host} is effectively disabled by resolved options in partition factory (EnableRateLimiting is false). Returning NoLimiter.",
                        httpContext.Request.Headers.Host.ToString());
                    return RateLimitPartition.GetNoLimiter(httpContext.Request.Headers.Host.ToString());
                }

                partitionLogger.LogInformation(
                    "RateLimit PartitionFactory for Host {Host}: Using PermitLimit={PermitLimit}, Window={WindowInSeconds}s",
                    httpContext.Request.Headers.Host.ToString(),
                    appRateLimitOptions.PermitLimit,
                    appRateLimitOptions.WindowInSeconds);

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Request.Headers.Host.ToString(),
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = appRateLimitOptions.PermitLimit,
                        Window = TimeSpan.FromSeconds((double)appRateLimitOptions.WindowInSeconds), // Explicit cast to double
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    });
            });

            // Configure RejectionStatusCode and OnRejected
            // We need IServiceProvider to get the correctly configured RateLimitOptions for RejectionStatusCode.
            // This lambda for AddRateLimiter doesn't directly provide IServiceProvider for *this* part.
            // So, we extract the options from the IConfiguration that was initially passed.
            // CustomApiFactory ensures that this IConfiguration is already modified for tests.
            // However, a more robust way for RejectionStatusCode is if UseRateLimit reads it or if OnRejected sets it.
            // For now, we'll keep it simple: OnRejected will ensure the correct status on ProblemDetails.
            // The middleware will set its status code based on what's configured here.

            var initialAppRateLimitOptions = config.GetSection(nameof(RateLimitOptions)).Get<RateLimitOptions>();
            if (initialAppRateLimitOptions != null && initialAppRateLimitOptions.EnableRateLimiting) {
                 limiterMiddlewareOptions.RejectionStatusCode = initialAppRateLimitOptions.RejectionStatusCode;
            } else {
                // Fallback or default if not enabled or not found initially
                // This path should ideally not be hit in tests if CustomApiFactory configures options properly.
                limiterMiddlewareOptions.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            }


            limiterMiddlewareOptions.OnRejected = async (rejectionContext, token) =>
            {
                // Resolve current options from DI to ensure test overrides are respected
                var currentAppRateLimitOptions = rejectionContext.HttpContext.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;
                var onRejectedLogger = rejectionContext.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RateLimitOnRejectedHandler");

                try
                {
                    onRejectedLogger.LogInformation("Rate limit OnRejected triggered. TraceId: {TraceId}. Effective PermitLimit for response: {PermitLimit}",
                        rejectionContext.HttpContext.TraceIdentifier, currentAppRateLimitOptions.PermitLimit);

                    rejectionContext.HttpContext.Response.Headers.Append("X-RateLimit-Limit", currentAppRateLimitOptions.PermitLimit.ToString());
                    rejectionContext.HttpContext.Response.Headers.Append("X-RateLimit-Remaining", "0");

                    string? retryAfterHeaderValueString = null;
                    if (rejectionContext.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfterTimeSpan))
                    {
                        var resetTime = DateTimeOffset.UtcNow.Add(retryAfterTimeSpan);
                        rejectionContext.HttpContext.Response.Headers.Append("X-RateLimit-Reset", resetTime.ToUnixTimeSeconds().ToString());
                        retryAfterHeaderValueString = ((int)retryAfterTimeSpan.TotalSeconds).ToString();
                        onRejectedLogger.LogInformation("RetryAfter metadata found: {RetryAfterValue}s. X-RateLimit-Reset: {ResetTimestamp}. TraceId: {TraceId}",
                                                 retryAfterHeaderValueString, resetTime.ToUnixTimeSeconds(), rejectionContext.HttpContext.TraceIdentifier);
                    }
                    else
                    {
                        onRejectedLogger.LogWarning("RetryAfter metadata was NOT found on the rejected lease. TraceId: {TraceId}", rejectionContext.HttpContext.TraceIdentifier);
                    }
                    onRejectedLogger.LogInformation("Custom rate limit headers appended. TraceId: {TraceId}", rejectionContext.HttpContext.TraceIdentifier);

                    var problemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails
                    {
                        // Use the RejectionStatusCode from the resolved options for the ProblemDetails body
                        Status = currentAppRateLimitOptions.RejectionStatusCode,
                        Title = "API Rate Limit Exceeded",
                        Detail = $"You have reached the maximum number of requests allowed for the address ({rejectionContext.HttpContext.Request.Headers.Host}). Please try again after the specified period.",
                        Type = "urn:bjjeire:rate-limit-exceeded",
                        Instance = rejectionContext.HttpContext.TraceIdentifier
                    };

                    if (retryAfterHeaderValueString != null)
                    {
                        problemDetails.Extensions["retryAfterSeconds"] = retryAfterHeaderValueString;
                    }
                    problemDetails.Extensions["limit"] = currentAppRateLimitOptions.PermitLimit;
                    problemDetails.Extensions["windowSeconds"] = currentAppRateLimitOptions.WindowInSeconds;

                    var problemDetailsJsonForLog = JsonSerializer.Serialize(problemDetails);
                    onRejectedLogger.LogInformation("Constructed ProblemDetails: {ProblemDetailsJson}. TraceId: {TraceId}", problemDetailsJsonForLog, rejectionContext.HttpContext.TraceIdentifier);

                    if (rejectionContext.HttpContext.Response.HasStarted)
                    {
                        onRejectedLogger.LogWarning("Response has already started before attempting to write ProblemDetails. TraceId: {TraceId}", rejectionContext.HttpContext.TraceIdentifier);
                        return;
                    }

                    // Ensure the response status code matches the ProblemDetails status
                    rejectionContext.HttpContext.Response.StatusCode = currentAppRateLimitOptions.RejectionStatusCode;
                    rejectionContext.HttpContext.Response.ContentType = "application/problem+json";
                    await rejectionContext.HttpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken: token);
                    onRejectedLogger.LogInformation("Successfully wrote ProblemDetails to response. TraceId: {TraceId}", rejectionContext.HttpContext.TraceIdentifier);
                }
                catch (Exception ex)
                {
                    onRejectedLogger.LogError(ex, "Unhandled exception in OnRejected callback. TraceId: {TraceId}", rejectionContext.HttpContext.TraceIdentifier);
                    if (!rejectionContext.HttpContext.Response.HasStarted)
                    {
                        try
                        {
                            rejectionContext.HttpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
                            rejectionContext.HttpContext.Response.ContentType = "application/problem+json";
                            await rejectionContext.HttpContext.Response.WriteAsJsonAsync(new { title = "Error processing rate limit rejection", detail = ex.Message }, cancellationToken: token);
                        }
                        catch (Exception nestedEx)
                        {
                            onRejectedLogger.LogError(nestedEx, "Failed to write generic error in OnRejected catch block. TraceId: {TraceId}", rejectionContext.HttpContext.TraceIdentifier);
                        }
                    }
                }
            };
        });
        return services;
    }

    internal static IApplicationBuilder UseRateLimit(this IApplicationBuilder app)
    {
        //var logger = app.ApplicationServices.GetRequiredService<ILogger<RateLimitExtensions>>();
        // This will now correctly reflect the overrides from CustomApiFactory
        var optionsFromDI = app.ApplicationServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;

        // logger.LogInformation(
        //     "RateLimitExtensions.UseRateLimit called. Resolved IOptions<RateLimitOptions>: Enable={Enable}, PermitLimit={PermitLimit}, Window={WindowInSeconds}, RejectionCode={RejectionCode}",
        //     optionsFromDI.EnableRateLimiting,
        //     optionsFromDI.PermitLimit,
        //     optionsFromDI.WindowInSeconds,
        //     optionsFromDI.RejectionStatusCode);

        if (optionsFromDI.EnableRateLimiting)
        {
            // logger.LogInformation("app.UseRateLimiter() will be executed with effective PermitLimit: {PermitLimit}.", optionsFromDI.PermitLimit);
            _ = app.UseRateLimiter();
        }
        else
        {
            // logger.LogWarning("app.UseRateLimiter() will NOT be executed as EnableRateLimiting is false in IOptions.");
        }
        return app;
    }
}
