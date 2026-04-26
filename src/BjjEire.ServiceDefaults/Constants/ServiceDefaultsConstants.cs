// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.ServiceDefaults.Constants;

public static class ServiceDefaultsConstants
{
    public const string HealthCheckPath = "/health";

    public const string LivenessCheckPath = "/alive";

    public const string LivenessTag = "live";

    public const string OtlpEndpointKey = "OTEL_EXPORTER_OTLP_ENDPOINT";
}
