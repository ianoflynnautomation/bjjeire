
namespace BjjEire.ServiceDefaults.Constants;

public static class ServiceDefaultsConstants {
    public const string HealthCheckPath = "/health";

    public const string LivenessCheckPath = "/alive";

    public const string LivenessTag = "live";

    public const string OtlpEndpointKey = "OTEL_EXPORTER_OTLP_ENDPOINT";

    public const string DefaultServiceName = "BjjEire.Api";
}
