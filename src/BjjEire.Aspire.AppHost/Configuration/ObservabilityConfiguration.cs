namespace BjjEire.Aspire.AppHost.Configuration;
public static class ObservabilityConfiguration {
    public static void AddObservability(IDistributedApplicationBuilder builder) {
        // Grafana
        _ = builder.AddContainer("grafana", "grafana/grafana")
            .WithBindMount("../../infra/grafana/config/grafana.ini", "/etc/grafana/grafana.ini", true)
            .WithBindMount("../../infra/grafana/config/provisioning/datasources", "/etc/grafana/provisioning/datasources", true)
            .WithBindMount("../../infra/grafana/config/provisioning/dashboards", "/var/lib/grafana/dashboards", true)
            .WithHttpEndpoint(port: 3200, targetPort: 3000, name: "http")
            .WithVolume("grafana-data", "/var/lib/grafana");

        // Prometheus
        _ = builder.AddContainer("prometheus", "prom/prometheus:v2.47.0")
            .WithBindMount("../../infra/prometheus/prometheus.yml", "/etc/prometheus/prometheus.yml", true)
            .WithBindMount("../../infra/prometheus/rules", "/etc/prometheus/rules", true)
            .WithHttpEndpoint(port: 9090, targetPort: 9090, name: "http")
            .WithVolume("prometheus-data", "/prometheus");

        // Loki
        _ = builder.AddContainer("loki", "grafana/loki:3.1.0")
            .WithBindMount("../../infra/loki.yml", "/etc/loki/loki.yml", true)
            .WithVolume("loki-data", "/loki")
            .WithHttpEndpoint(port: 3100, targetPort: 3100, name: "http")
            .WithArgs("-config.file=/etc/loki/loki.yml");

        // Jaeger
        _ = builder.AddContainer("jaeger", "jaegertracing/all-in-one:latest")
            .WithBindMount("../../infra/jaeger/jaeger-ui.json", "/etc/jaeger/jaeger-ui.json", true)
            .WithEnvironment("METRICS_STORAGE_TYPE", "prometheus")
            .WithEnvironment("PROMETHEUS_SERVER_URL", "http://prometheus:9090")
            .WithHttpEndpoint(port: 16686, targetPort: 16686, name: "ui")
            .WithHttpEndpoint(port: 4317, targetPort: 4317, name: "otlp")
            .WithArgs("--query.ui-config=/etc/jaeger/jaeger-ui.json");

        // OpenTelemetry Collector
        _ = builder.AddContainer("otel-collector", "otel/opentelemetry-collector:latest")
            .WithBindMount("../../infra/otel-collector/otel-collector.yml", "/etc/otelcol/config.yaml", true)
            .WithHttpEndpoint(port: 8889, targetPort: 8889, name: "metrics")
            .WithHttpEndpoint(port: 4317, targetPort: 4317, name: "otlp-grpc")
            .WithHttpEndpoint(port: 4318, targetPort: 4318, name: "otlp-http");
    }
}