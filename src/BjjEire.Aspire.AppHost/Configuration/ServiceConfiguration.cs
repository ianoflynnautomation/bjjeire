using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using OpenTelemetry.Logs;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class ServiceConfiguration
{
    public static void ConfigureServices(IDistributedApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.Services.AddLogging(logging =>
        _ = logging.AddOpenTelemetry(options =>
        _ = options.AddOtlpExporter(exporter => exporter.Endpoint = new Uri("http://otel-collector:4317"))));
    }
}
