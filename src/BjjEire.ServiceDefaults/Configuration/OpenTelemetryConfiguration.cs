using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using BjjEire.ServiceDefaults.Constants;

namespace BjjEire.ServiceDefaults.Configuration;

public static class OpenTelemetryConfiguration {
    public static IHostApplicationBuilder ConfigureOpenTelemetry(
        this IHostApplicationBuilder builder,
        ServiceDefaultsOptions options) {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(options);

        var entryAssembly = Assembly.GetEntryAssembly();
        var entryAssemblyName = entryAssembly?.GetName();
        var versionAttribute = entryAssembly?.GetCustomAttributes(false)
            .OfType<AssemblyInformationalVersionAttribute>()
            .FirstOrDefault();
        var serviceName = options.ServiceName ?? entryAssemblyName?.Name ?? ServiceDefaultsConstants.DefaultServiceName;
        var serviceVersion = versionAttribute?.InformationalVersion ?? entryAssemblyName?.Version?.ToString();

        var resourceBuilder = ResourceBuilder.CreateDefault()
            .AddService(serviceName: serviceName, serviceVersion: serviceVersion)
            .AddTelemetrySdk()
            .AddAttributes(new Dictionary<string, object> {
                ["host.name"] = Environment.MachineName,
                ["os.description"] = System.Runtime.InteropServices.RuntimeInformation.OSDescription,
                ["deployment.environment"] = builder.Environment.EnvironmentName
            });

        // Configure logging
        _ = builder.Logging.AddOpenTelemetry(logging => {
            logging.IncludeFormattedMessage = true;
            logging.IncludeScopes = true;
            _ = logging.SetResourceBuilder(resourceBuilder);
        });

        // Configure OpenTelemetry
        _ = builder.Services.AddOpenTelemetry()
            .ConfigureResource(r => r.AddService(serviceName))
            .WithMetrics(metrics => metrics
                .SetResourceBuilder(resourceBuilder)
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddRuntimeInstrumentation()
                .AddMeter("gyms, bjjevents"))
            .WithTracing(tracing => tracing
                .SetResourceBuilder(resourceBuilder)
                .AddAspNetCoreInstrumentation(o => o.RecordException = true)
                .AddHttpClientInstrumentation()
                .SetSampler(builder.Environment.IsDevelopment() ? new AlwaysOnSampler() : new TraceIdRatioBasedSampler(0.1)));

        // Add exporters
        AddOpenTelemetryExporters(builder, options);

        return builder;
    }

    private static void AddOpenTelemetryExporters(IHostApplicationBuilder builder, ServiceDefaultsOptions options) {
        var useOtlpExporter = !string.IsNullOrWhiteSpace(builder.Configuration[ServiceDefaultsConstants.OtlpEndpointKey]);

        if (useOtlpExporter) {
            _ = builder.Services.AddOpenTelemetry().UseOtlpExporter();
        }

        if (options.EnablePrometheus) {
            _ = builder.Services.AddOpenTelemetry()
                .WithMetrics(metrics => metrics.AddPrometheusExporter(options => {
                    options.DisableTotalNameSuffixForCounters = true;
                    options.ScrapeEndpointPath = "/metrics";
                }));
        }
    }
}