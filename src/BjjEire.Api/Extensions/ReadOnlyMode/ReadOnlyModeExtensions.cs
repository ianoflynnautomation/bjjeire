// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.Extensions.ReadOnlyMode;

public static class ReadOnlyModeExtensions
{
    private static readonly HashSet<string> AllowedMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Get,
        HttpMethods.Head,
        HttpMethods.Options,
    };

    public static IServiceCollection AddReadOnlyMode(this IServiceCollection services, IConfiguration configuration)
    {
        _ = services.Configure<ReadOnlyModeOptions>(configuration.GetSection(ReadOnlyModeOptions.SectionName));
        return services;
    }

    public static IApplicationBuilder UseReadOnlyMode(this IApplicationBuilder app)
    {
        return app.Use(async (context, next) =>
        {
            ReadOnlyModeOptions options = context.RequestServices.GetRequiredService<IOptions<ReadOnlyModeOptions>>().Value;

            if (!options.Enabled || AllowedMethods.Contains(context.Request.Method))
            {
                await next();
                return;
            }

            ProblemDetails problem = new()
            {
                Status = StatusCodes.Status405MethodNotAllowed,
                Title = "Method Not Allowed",
                Detail = "The API is currently in read-only mode. Write operations are disabled.",
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.5",
            };

            context.Response.StatusCode = StatusCodes.Status405MethodNotAllowed;
            context.Response.Headers.Allow = "GET, HEAD, OPTIONS";
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(problem);
        });
    }
}
