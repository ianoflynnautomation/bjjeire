using BjjEire.ServiceDefaults.Constants;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

namespace BjjEire.ServiceDefaults.Configuration;

public static class HealthCheckConfiguration
{

    public static IHostApplicationBuilder AddDefaultHealthChecks(this IHostApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.Services.AddHealthChecks()
        .AddCheck("self", () => HealthCheckResult.Healthy(), [ServiceDefaultsConstants.LivenessTag]);

        return builder;
    }

    public static WebApplication MapDefaultEndpoints(WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        if (app.Environment.IsDevelopment())
        {
            _ = app.MapHealthChecks(ServiceDefaultsConstants.HealthCheckPath);
            _ = app.MapHealthChecks(ServiceDefaultsConstants.LivenessCheckPath, new HealthCheckOptions
            {
                Predicate = r => r.Tags.Contains(ServiceDefaultsConstants.LivenessTag)
            });
        }

        return app;
    }
}
