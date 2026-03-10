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

        var solutionRoot = Path.GetFullPath(Path.Combine(builder.AppHostDirectory, ServiceConstants.BasePath));
        var dockerfilePath = Path.Combine(solutionRoot, "src/BjjEire.Api/Dockerfile");

        var certPath = builder.Configuration["ASPNETCORE_KESTREL_CERT_PATH"];
        var certPassword = builder.Configuration["ASPNETCORE_KESTREL_CERT_PASSWORD"];
        var hasCerts = certPath is not null && certPassword is not null;

        var resource = builder.AddDockerfile("api", solutionRoot, dockerfilePath)
            .WithReference(mongo)
            .WaitFor(mongo)
            .WithHttpEndpoint(port: ServiceConstants.ApiHttpPort, targetPort: 80)
            .WithEnvironment("ASPNETCORE_ENVIRONMENT", builder.Configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production")
            .WithEnvironment("ASPNETCORE_URLS", hasCerts ? "https://+;http://+" : "http://+")
            .WithEnvironment("ASPNETCORE_HTTP_PORT", builder.Configuration["ASPNETCORE_HTTP_PORT"] ?? "80")
            .WithEnvironment("ConnectionStrings__Mongodb", BuildMongoConnectionString(builder.Configuration))
            .WithEnvironment("CorsOptions__AllowedOrigins", builder.Configuration["CORS_ORIGINS"] ?? string.Empty)
            .WithEnvironment("AzureAd__TenantId", builder.Configuration["AZURE_AD_TENANT_ID"] ?? string.Empty)
            .WithEnvironment("AzureAd__ClientId", builder.Configuration["AZURE_AD_CLIENT_ID"] ?? string.Empty)
            .WithEnvironment("AzureAd__Audience", builder.Configuration["AZURE_AD_AUDIENCE"] ?? string.Empty);

        if (hasCerts)
        {
            resource = resource
                .WithHttpsEndpoint(port: ServiceConstants.ApiHttpsPort, targetPort: 443, name: "https")
                .WithEnvironment("ASPNETCORE_HTTPS_PORT", builder.Configuration["ASPNETCORE_HTTPS_PORT"] ?? "443")
                .WithEnvironment("ASPNETCORE_Kestrel__Certificates__Default__Path", certPath!)
                .WithEnvironment("ASPNETCORE_Kestrel__Certificates__Default__Password", certPassword!);
        }

        return resource;
    }

    private static string BuildMongoConnectionString(ConfigurationManager configuration)
    {
        var user = configuration["MONGODB_USER"] ?? "admin";
        var password = configuration["MONGODB_PASSWORD"] ?? "password";
        var host = configuration["MONGODB_HOST"] ?? "mongodb";
        var port = configuration["MONGODB_PORT"] ?? "27017";
        var db = configuration["MONGODB_DB"] ?? "Mongodb";
        return $"mongodb://{user}:{password}@{host}:{port}/{db}?authSource=admin&authMechanism=SCRAM-SHA-256";
    }
}
