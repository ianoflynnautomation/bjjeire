using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using BjjEire.ServiceDefaults.Configuration;

namespace BjjEire.ServiceDefaults;

public static class Extensions {
    public static TBuilder AddServiceDefaults<TBuilder>(
        this TBuilder builder,
        Action<ServiceDefaultsOptions>? options = null)
        where TBuilder : IHostApplicationBuilder {
        ArgumentNullException.ThrowIfNull(builder);

        var defaultsOptions = new ServiceDefaultsOptions();
        options?.Invoke(defaultsOptions);

        _ = OpenTelemetryConfiguration.ConfigureOpenTelemetry(builder, defaultsOptions);
        _ = HealthCheckConfiguration.AddDefaultHealthChecks(builder);
        ServiceDiscoveryConfiguration.ConfigureServiceDiscovery(builder);

        return builder;
    }

    public static WebApplication MapDefaultEndpoints(this WebApplication app)
    => HealthCheckConfiguration.MapDefaultEndpoints(app);
}