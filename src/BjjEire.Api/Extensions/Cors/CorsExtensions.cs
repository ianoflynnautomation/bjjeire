using BjjEire.Api.Constants;

namespace BjjEire.Api.Extensions.Cors;

public static class CorsExtensions
{
    internal static IHostApplicationBuilder ConfigureCors(this IHostApplicationBuilder builder)
    {
        var allowedOrigins = builder.Configuration.GetSection("CorsOptions:AllowedOrigins").Get<string[]>() ?? [];

        _ = builder.Services.AddCors(options =>
        {
            options.AddPolicy(ConfigurationsConstants.DevelopmentCorsPolicyName,
                builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
            options.AddPolicy(ConfigurationsConstants.ProductionCorsPolicyName,
                builder => builder.WithOrigins(allowedOrigins).AllowAnyMethod().AllowAnyHeader());
        });

        return builder;
    }

    internal static WebApplication UseCors(this WebApplication app)
    {
        _ = app.Environment.IsDevelopment()
            ? app.UseCors(ConfigurationsConstants.DevelopmentCorsPolicyName)
            : app.UseCors(ConfigurationsConstants.ProductionCorsPolicyName);

        return app;

    }

}
