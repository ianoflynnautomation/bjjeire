using BjjEire.Api.Constants;

namespace BjjEire.Api.Extensions.Cors;

public static class CorsExtensions
{
    internal static IHostApplicationBuilder ConfigureCors(this IHostApplicationBuilder builder)
    {
        var corsOptions = builder.Configuration
            .GetSection(CorsOptions.SectionName)
            .Get<CorsOptions>() ?? new CorsOptions();

        _ = builder.Services.AddCors(options =>
        {
            options.AddPolicy(ConfigurationsConstants.CorsPolicyName, policy =>
            {
                _ = policy.WithOrigins(corsOptions.AllowedOrigins)
                    .WithMethods(corsOptions.AllowedMethods)
                    .WithHeaders(corsOptions.AllowedHeaders)
                    .WithExposedHeaders(
                        "X-RateLimit-Limit",
                        "X-RateLimit-Remaining",
                        "X-RateLimit-Reset",
                        "Retry-After")
                    .DisallowCredentials();
            });
        });

        return builder;
    }

    internal static WebApplication UseCors(this WebApplication app)
    {
        _ = app.UseCors(ConfigurationsConstants.CorsPolicyName);
        return app;
    }
}
