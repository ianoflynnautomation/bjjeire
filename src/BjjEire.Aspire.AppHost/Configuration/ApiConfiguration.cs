// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Aspire.AppHost.Constants;

using Microsoft.Extensions.Configuration;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class ApiConfiguration
{
    public static IResourceBuilder<ContainerResource> AddApi(
        IDistributedApplicationBuilder builder,
        IResourceBuilder<MongoDBDatabaseResource> mongo)
    {
        ArgumentNullException.ThrowIfNull(builder);

        string solutionRoot = Path.GetFullPath(Path.Combine(builder.AppHostDirectory, ServiceConstants.BasePath));
        string dockerfilePath = Path.Combine(solutionRoot, "src/BjjEire.Api/Dockerfile");

        ConfigurationManager config = builder.Configuration;

        string? tenantId = config["AZURE_AD_TENANT_ID"];
        string? clientId = config["AZURE_AD_CLIENT_ID"];
        string? audience = config["AZURE_AD_AUDIENCE"];
        string? donationBitcoinAddress = config["DONATION_BITCOIN_ADDRESS"];
        string? otelEndpoint = config["OTEL_EXPORTER_OTLP_ENDPOINT"];

        string environment = config["ASPNETCORE_ENVIRONMENT"] ?? "Development";

        IResourceBuilder<ContainerResource> resource = builder.AddDockerfile("api", solutionRoot, dockerfilePath)
            .WithReference(mongo)
            .WaitFor(mongo)
            .WithHttpEndpoint(port: ServiceConstants.ApiHttpPort, targetPort: 80)
            .WithEnvironment("ASPNETCORE_ENVIRONMENT", environment)
            .WithEnvironment("ASPNETCORE_URLS", "http://+:80")
            .WithEnvironment("ASPNETCORE_HTTP_PORT", config["ASPNETCORE_HTTP_PORT"] ?? "80")
            .WithEnvironment("CorsOptions__AllowedOrigins", config["CORS_ORIGINS"] ?? "http://localhost:3000,https://localhost:3000")
            .WithEnvironment("CorsOptions__AllowedMethods", config["CORS_METHODS"] ?? "GET,POST,PUT,DELETE")
            .WithEnvironment("CorsOptions__AllowedHeaders", config["CORS_HEADERS"] ?? "Authorization,Content-Type")
            .WithEnvironment("RateLimitOptions__EnableRateLimiting", config["RateLimitOptions__EnableRateLimiting"] ?? "false")
            .WithEnvironment("RateLimitOptions__PermitLimit", "5")
            .WithEnvironment("RateLimitOptions__WindowInSeconds", "10")
            .WithEnvironment("RateLimitOptions__RejectionStatusCode", "429")
            .WithEnvironment("CacheOptions__DefaultExpirationMinutes", "5")
            .WithEnvironment("ReadOnlyMode__Enabled", config["ReadOnlyMode__Enabled"] ?? "true")
            .WithEnvironment("CompetitionDeactivation__Interval", "1.00:00:00")
            .WithEnvironment("CompetitionDeactivation__InitialDelay", "00:00:30")
            .WithEnvironment("FeatureManagement__BjjEvents", config["FeatureManagement__BjjEvents"] ?? "true")
            .WithEnvironment("FeatureManagement__Gyms", config["FeatureManagement__Gyms"] ?? "true")
            .WithEnvironment("FeatureManagement__Stores", config["FeatureManagement__Stores"] ?? "true")
            .WithEnvironment("FeatureManagement__Competitions", config["FeatureManagement__Competitions"] ?? "true")
            .WithEnvironment("ServiceDefaults__ServiceName", "BjjEire.Api")
            .WithEnvironment("ServiceDefaults__EnablePrometheus", "false")
            .WithEnvironment("AzureAd__Instance", "https://login.microsoftonline.com/")
            .WithEnvironment("Serilog__Properties__Application", "BjjWorld.Api")
            .WithEnvironment("OTEL_EXPORTER_OTLP_ENDPOINT", otelEndpoint ?? string.Empty)
            .WithEnvironment("OTEL_RESOURCE_ATTRIBUTES", $"service.name=BjjEire.Api,deployment.environment={environment}");

        if (!string.IsNullOrWhiteSpace(tenantId))
        {
            resource = resource.WithEnvironment("AzureAd__TenantId", tenantId);
        }

        if (!string.IsNullOrWhiteSpace(clientId))
        {
            resource = resource.WithEnvironment("AzureAd__ClientId", clientId);
        }

        if (!string.IsNullOrWhiteSpace(audience))
        {
            resource = resource.WithEnvironment("AzureAd__Audience", audience);
        }

        if (!string.IsNullOrWhiteSpace(donationBitcoinAddress))
        {
            resource = resource.WithEnvironment("Donation__BitcoinAddress", donationBitcoinAddress);
        }

        return resource;
    }
}
