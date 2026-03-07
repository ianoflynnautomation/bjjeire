using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.ServiceDiscovery;

namespace BjjEire.ServiceDefaults.Configuration;

public static class ServiceDiscoveryConfiguration
{
    public static void ConfigureServiceDiscovery(IHostApplicationBuilder builder, ServiceDefaultsOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.Services.AddServiceDiscovery();

        _ = builder.Services.ConfigureHttpClientDefaults(http =>
        {
            _ = http.AddStandardResilienceHandler();
            _ = http.AddServiceDiscovery();
        });

        if (options?.AllowedSchemes?.Count > 0)
        {
            _ = builder.Services.Configure<ServiceDiscoveryOptions>(o => o.AllowedSchemes = [.. options.AllowedSchemes]);
        }
    }
}
