using BjjWorld.Api.Constants;

namespace BjjWorld.Api.Extensions;

public static class CorsExtensions
{

    internal static IHostApplicationBuilder ConfigureCors(this IHostApplicationBuilder builder)
    {
        var allowedOrigins = builder.Configuration.GetSection("CorsOptions:AllowedOrigins").Get<string[]>() ?? [];

        builder.Services.AddCors(options =>
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
        if (app.Environment.IsDevelopment())
            app.UseCors(ConfigurationsConstants.DevelopmentCorsPolicyName);
        else
            app.UseCors(ConfigurationsConstants.ProductionCorsPolicyName);

        return app;

    }

}
