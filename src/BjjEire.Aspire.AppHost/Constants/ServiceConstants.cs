namespace BjjEire.Aspire.AppHost.Constants;

public static class ServiceConstants
{
    public const string NetworkName = "bjj-network";
    public const string BasePath = "../../";

    // API
    public const int ApiHttpPort = 5003;
    public const int ApiHttpsPort = 5001;
    public const string ApiLogsVolume = "api-logs";
    public const string ApiCertsVolume = "api-certs";

    // Frontend
    public const int FrontendHttpPort = 60742;
    public const int FrontendHttpsPort = 60743;

    // MongoDB
    public const string MongoDbVolume = "mongodb_data";
    public const int MongoDbPort = 27017;

    // Observability
    public const string GrafanaVolume = "grafana-data";
    public const int GrafanaPort = 3000;
    public const string PrometheusVolume = "prometheus-data";
    public const int PrometheusPort = 9090;
    public const string LokiVolume = "loki-data";
    public const int LokiPort = 3100;
    public const int JaegerUiPort = 16686;
    public const int JaegerOtlpPort = 4317;
    public const int OtelCollectorMetricsPort = 8889;
    public const int OtelCollectorOtlpGrpcPort = 4317;
    public const int OtelCollectorOtlpHttpPort = 4318;
}
