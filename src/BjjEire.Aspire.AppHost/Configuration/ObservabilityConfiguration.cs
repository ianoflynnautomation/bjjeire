using BjjEire.Aspire.AppHost.Constants;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class ObservabilityConfiguration {
    public static void AddObservability(IDistributedApplicationBuilder builder) {
        ArgumentNullException.ThrowIfNull(builder);

        var alertManager = AddAlertManager(builder);
        var prometheus = AddPrometheus(builder, alertManager);
        var loki = AddLoki(builder);
        var jaeger = AddJaeger(builder, prometheus);
        _ = AddOtelCollector(builder, prometheus, loki, jaeger);
        _ = AddGrafana(builder, prometheus);
        _ = AddNodeExporter(builder);
    }

    private static IResourceBuilder<ContainerResource> AddGrafana(
        IDistributedApplicationBuilder builder,
        IResourceBuilder<ContainerResource> prometheus) {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(prometheus);

        var grafana = builder.AddContainer("grafana", "grafana/grafana")
            .WithBindMount($"{ServiceConstants.BasePath}infra/grafana/config/grafana.ini", "/etc/grafana/grafana.ini", true)
            .WithBindMount($"{ServiceConstants.BasePath}infra/grafana/config/provisioning/datasources", "/etc/grafana/provisioning/datasources", true)
            .WithBindMount($"{ServiceConstants.BasePath}infra/grafana/config/provisioning/dashboards", "/var/lib/grafana/dashboards", true)
            .WithVolume(ServiceConstants.GrafanaVolume, "/var/lib/grafana")
            .WithHttpEndpoint(port: ServiceConstants.GrafanaPort, targetPort: 3000, name: "http")
            .WithEnvironment("GF_SERVER_ROOT_URL", builder.Configuration["GF_SERVER_ROOT_URL"] ?? "")
            .WithEnvironment("GF_SECURITY_ADMIN_USER", builder.Configuration["GF_SECURITY_ADMIN_USER"] ?? "")
            .WithEnvironment("GF_SECURITY_ADMIN_PASSWORD", builder.Configuration["GF_SECURITY_ADMIN_PASSWORD"] ?? "")
            .WithEnvironment("GF_AUTH_ANONYMOUS_ENABLED", builder.Configuration["GF_AUTH_ANONYMOUS_ENABLED"] ?? "")
            .WithEnvironment("GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH", builder.Configuration["GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH"] ?? "")
            .WithEnvironment("GF_DASHBOARDS_MIN_REFRESH_INTERVAL", builder.Configuration["GF_DASHBOARDS_MIN_REFRESH_INTERVAL"] ?? "")
            .WithEnvironment("GF_INSTALL_PLUGINS", builder.Configuration["GF_INSTALL_PLUGINS"] ?? "")
            .WithEnvironment("GF_LOG_LEVEL", builder.Configuration["GF_LOG_LEVEL"] ?? "")
            .WithEnvironment("GF_LOG_MODE", builder.Configuration["GF_LOG_MODE"] ?? "")
            .WithEnvironment("GF_DATABASE_TYPE", builder.Configuration["GF_DATABASE_TYPE"] ?? "")
            .WithEnvironment("GF_DATABASE_HOST", builder.Configuration["GF_DATABASE_HOST"] ?? "")
            .WithEnvironment("GF_DATABASE_NAME", builder.Configuration["GF_DATABASE_NAME"] ?? "")
            .WithEnvironment("GF_DATABASE_USER", builder.Configuration["GF_DATABASE_USER"] ?? "")
            .WithEnvironment("GF_DATABASE_PASSWORD", builder.Configuration["POSTGRES_PASSWORD"] ?? "") // Assuming this is intentional, referencing POSTGRES_PASSWORD
            .WithEnvironment("GF_AUTH_SESSION_PROVIDER", builder.Configuration["GF_AUTH_SESSION_PROVIDER"] ?? "")
            .WithEnvironment("GF_AUTH_SESSION_PROVIDER_CONFIG", builder.Configuration["GF_AUTH_SESSION_PROVIDER_CONFIG"] ?? "")
            //.WithHealthCheck("/api/health")
            .WaitFor(prometheus);

        return grafana;
    }

    private static IResourceBuilder<ContainerResource> AddAlertManager(
        IDistributedApplicationBuilder builder) {
        ArgumentNullException.ThrowIfNull(builder);

        var alertmanager = builder.AddContainer("alertmanager", "prom/alertmanager")
            .WithBindMount($"{ServiceConstants.BasePath}infra/alertmanager/alertmanager.yml", "/etc/alertmanager/alertmanager.yml")
            .WithVolume("alertmanager-data", "/alertmanager") // Consider using ServiceConstants for volume name if applicable
                                                              // .WithHttpEndpoint(port: 9093, targetPort: 9093, name: "http")
            .WithArgs("--config.file=/etc/alertmanager/alertmanager.yml", "--storage.path=/alertmanager");
            //.WithHealthCheck("/-/healthy");

        return alertmanager;
    }

    private static IResourceBuilder<ContainerResource> AddPrometheus(
        IDistributedApplicationBuilder builder,
        IResourceBuilder<ContainerResource> alertManager) {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(alertManager);

        var prometheus = builder.AddContainer("prometheus", "prom/prometheus")
            .WithBindMount($"{ServiceConstants.BasePath}infra/prometheus/prometheus.yml", "/etc/prometheus/prometheus.yml")
            .WithBindMount($"{ServiceConstants.BasePath}infra/prometheus/rules", "/etc/prometheus/rules")
            .WithVolume(ServiceConstants.PrometheusVolume, "/prometheus")
            // .WithHttpEndpoint(port: ServiceConstants.PrometheusPort, targetPort: 9090, name: "http")
            .WithArgs(
                "--config.file=/etc/prometheus/prometheus.yml",
                "--storage.tsdb.path=/prometheus",
                "--web.console.libraries=/usr/share/prometheus/console_libraries",
                "--web.console.templates=/usr/share/prometheus/consoles",
                "--web.enable-lifecycle")
            //.WithHealthCheck("/-/healthy")
            .WaitFor(alertManager);

        return prometheus;
    }

    private static IResourceBuilder<ContainerResource> AddLoki(IDistributedApplicationBuilder builder) {
        ArgumentNullException.ThrowIfNull(builder);

        var loki = builder.AddContainer("loki", "grafana/loki")
            .WithBindMount($"{ServiceConstants.BasePath}infra/loki/loki.yml", "/mnt/config/loki-config.yml")
            .WithVolume("loki-index", "/loki/index")     // Consider using ServiceConstants for volume names
            .WithVolume("loki-chunks", "/loki/chunks")
            .WithVolume("loki-rules", "/loki/rules")
            // .WithHttpEndpoint(port: ServiceConstants.LokiPort, targetPort: 3100, name: "http")
            .WithArgs("-config.file=/mnt/config/loki-config.yml");
            //.WithHealthCheck("/ready");

        return loki;
    }

    private static IResourceBuilder<ContainerResource> AddJaeger(
        IDistributedApplicationBuilder builder,
        IResourceBuilder<ContainerResource> prometheus) {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(prometheus);

        var jaeger = builder.AddContainer("jaeger", "jaegertracing/all-in-one")
            .WithBindMount($"{ServiceConstants.BasePath}infra/jaeger/jaeger-ui.json", "/etc/jaeger/jaeger-ui.json")
            .WithEnvironment("METRICS_STORAGE_TYPE", "prometheus")
            .WithEnvironment("PROMETHEUS_SERVER_URL", $"http://prometheus:{ServiceConstants.PrometheusPort.ToString()}") // Ensure prometheus container name matches here
            .WithEnvironment("COLLECTOR_OTLP_ENABLED", "true")
            // .WithHttpEndpoint(port: ServiceConstants.JaegerUiPort, targetPort: 16686, name: "ui")
            // .WithHttpEndpoint(port: ServiceConstants.JaegerOtlpPort, targetPort: 4317, name: "otlp")
            .WithArgs("--query.ui-config=/etc/jaeger/jaeger-ui.json")
            //.WithHealthCheck("/")
            .WaitFor(prometheus);

        return jaeger;
    }

    private static IResourceBuilder<ContainerResource> AddOtelCollector(
        IDistributedApplicationBuilder builder,
        IResourceBuilder<ContainerResource> prometheus,
        IResourceBuilder<ContainerResource> loki,
        IResourceBuilder<ContainerResource> jaeger) {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(prometheus);
        ArgumentNullException.ThrowIfNull(loki);
        ArgumentNullException.ThrowIfNull(jaeger);

        var otelCollector = builder.AddContainer("otel-collector", "otel/opentelemetry-collector-contrib")
            .WithBindMount($"{ServiceConstants.BasePath}infra/otel-collector/otel-config.yaml", "/etc/otel/config.yaml")
            .WithVolume("otel-logs", "/log/otel") // Consider ServiceConstants
            .WithHttpEndpoint(port: ServiceConstants.OtelCollectorMetricsPort, targetPort: 8889, name: "metrics")
            // .WithHttpEndpoint(port: ServiceConstants.OtelCollectorOtlpGrpcPort, targetPort: 4317, name: "otlp-grpc") // OTLP gRPC receiver
            // .WithHttpEndpoint(port: ServiceConstants.OtelCollectorOtlpHttpPort, targetPort: 4318, name: "otlp-http") // OTLP HTTP receiver
            .WithEnvironment("JAEGER_ENDPOINT", builder.Configuration["JAEGER_ENDPOINT"] ?? $"jaeger:{ServiceConstants.JaegerOtlpPort}")
            .WithEnvironment("LOKI_ENDPOINT", builder.Configuration["LOKI_ENDPOINT"] ?? $"http://loki:{ServiceConstants.LokiPort}/loki/api/v1/push")
            .WithArgs("--config=/etc/otel/config.yaml")
            //.WithHealthCheck("http://localhost:13133") // This might not be the health check endpoint; often it's a dedicated health check path like /health or similar. Check collector docs.
            .WaitFor(prometheus)
            .WaitFor(loki)
            .WaitFor(jaeger);

        return otelCollector;
    }

    private static IResourceBuilder<ContainerResource> AddNodeExporter(IDistributedApplicationBuilder builder) {
        ArgumentNullException.ThrowIfNull(builder);

        var nodeExporter = builder.AddContainer("node-exporter", "quay.io/prometheus/node-exporter")
            .WithArgs("--path.rootfs=/host")
            // For security reasons, it's often better to mount specific paths from /proc and /sys needed by node-exporter
            // rather than the entire directories if possible, and ensure they are read-only.
            .WithBindMount("/proc", "/host/proc", isReadOnly: true) // Changed WithVolume to WithBindMount for host paths
            .WithBindMount("/sys", "/host/sys", isReadOnly: true)   // Changed WithVolume to WithBindMount for host paths
            .WithBindMount("/", "/rootfs", isReadOnly: true);       // Changed WithVolume to WithBindMount for host paths
                                                                    // Node exporter typically exposes metrics on port 9100. You might want to add:
                                                                    // .WithHttpEndpoint(port: ServiceConstants.NodeExporterPort /* e.g., 9100 */, targetPort: 9100, name: "metrics")
                                                                    // And then Prometheus would scrape this endpoint.

        return nodeExporter;
    }
}