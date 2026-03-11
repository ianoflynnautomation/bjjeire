using BjjEire.Aspire.AppHost.Constants;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class ApiConfiguration
{
    public static IResourceBuilder<ContainerResource> AddApi(
        IDistributedApplicationBuilder builder,
        IResourceBuilder<MongoDBDatabaseResource> mongo)
    {
        ArgumentNullException.ThrowIfNull(builder);

        var solutionRoot = Path.GetFullPath(Path.Combine(builder.AppHostDirectory, ServiceConstants.BasePath));
        var dockerfilePath = Path.Combine(solutionRoot, "src/BjjEire.Api/Dockerfile");

        var tenantId = builder.Configuration["AZURE_AD_TENANT_ID"];
        var clientId = builder.Configuration["AZURE_AD_CLIENT_ID"];
        var audience = builder.Configuration["AZURE_AD_AUDIENCE"];

        var resource = builder.AddDockerfile("api", solutionRoot, dockerfilePath)
            .WithReference(mongo)
            .WaitFor(mongo)
            .WithHttpEndpoint(port: ServiceConstants.ApiHttpPort, targetPort: 80)
            .WithEnvironment("ASPNETCORE_ENVIRONMENT", builder.Configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production")
            .WithEnvironment("ASPNETCORE_URLS", "http://+")
            .WithEnvironment("ASPNETCORE_HTTP_PORT", builder.Configuration["ASPNETCORE_HTTP_PORT"] ?? "80")
            .WithEnvironment("CorsOptions__AllowedOrigins", builder.Configuration["CORS_ORIGINS"] ?? string.Empty);

        if (!string.IsNullOrWhiteSpace(tenantId))
            resource = resource.WithEnvironment("AzureAd__TenantId", tenantId);
        if (!string.IsNullOrWhiteSpace(clientId))
            resource = resource.WithEnvironment("AzureAd__ClientId", clientId);
        if (!string.IsNullOrWhiteSpace(audience))
            resource = resource.WithEnvironment("AzureAd__Audience", audience);

        return resource;
    }
}
