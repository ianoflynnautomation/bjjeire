using BjjEire.ServiceDefaults.Configuration;

using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

#pragma warning disable CA1724 // Namespace does not match folder structure
namespace BjjEire.ServiceDefaults;
#pragma warning restore CA1724 // Namespace does not match folder structure

public static class Extensions
{
    public static TBuilder AddServiceDefaults<TBuilder>(
        this TBuilder builder,
        Action<ServiceDefaultsOptions>? options = null)
        where TBuilder : IHostApplicationBuilder
    {
        ArgumentNullException.ThrowIfNull(builder);

        ServiceDefaultsOptions defaultsOptions = new();
        options?.Invoke(defaultsOptions);

        _ = builder.ConfigureOpenTelemetry(defaultsOptions);
        _ = builder.AddDefaultHealthChecks();
        builder.ConfigureServiceDiscovery(defaultsOptions);

        return builder;
    }

    public static WebApplication MapDefaultEndpoints(this WebApplication app)
    => HealthCheckConfiguration.MapDefaultEndpoints(app);
}
