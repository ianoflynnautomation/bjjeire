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
        var contextPath = solutionRoot;
        var dockerfilePath = Path.Combine(solutionRoot, "src/BjjEire.Api/Dockerfile");

        var certPath = builder.Configuration["ASPNETCORE_KESTREL_CERT_PATH"]
            ?? throw new InvalidOperationException("Certificate path is not configured.");
        var certPassword = builder.Configuration["ASPNETCORE_KESTREL_CERT_PASSWORD"]
            ?? throw new InvalidOperationException("Certificate password is not configured.");

        var api = builder.AddDockerfile("api", contextPath, dockerfilePath)
        .WithReference(mongo)
        .WaitFor(mongo)
        .WithHttpEndpoint(port: ServiceConstants.ApiHttpPort, targetPort: 80)
        .WithHttpsEndpoint(port: ServiceConstants.ApiHttpsPort, targetPort: 443, name: "https")
        .WithEnvironment("ASPNETCORE_ENVIRONMENT", builder.Configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production")
        .WithEnvironment("ASPNETCORE_URLS", builder.Configuration["ASPNETCORE_URLS"] ?? "https://+;http://+")
        .WithEnvironment("ASPNETCORE_HTTP_PORT", builder.Configuration["ASPNETCORE_HTTP_PORT"] ?? "80")
        .WithEnvironment("ASPNETCORE_HTTPS_PORT", builder.Configuration["ASPNETCORE_HTTPS_PORT"] ?? "443")
        .WithEnvironment("ASPNETCORE_Kestrel__Certificates__Default__Password", certPath)
        .WithEnvironment("ASPNETCORE_Kestrel__Certificates__Default__Path", certPassword)
        .WithEnvironment("ConnectionStrings__Mongodb", BuildMongoConnectionString(builder.Configuration))
        .WithEnvironment("CorsOptions__AllowedOrigins", builder.Configuration["CORS_ORIGINS"] ?? string.Empty)
        .WithEnvironment("Serilog__WriteTo__1__Args__serverUrl", builder.Configuration["SEQ_URL"] ?? string.Empty)
        .WithEnvironment("Serilog__WriteTo__2__Args__endpoint", builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? string.Empty)
        .WithEnvironment("Serilog__Properties__Application", builder.Configuration["OTEL_SERVICE_NAME"] ?? string.Empty)
        .WithEnvironment("OTEL_EXPORTER_OTLP_ENDPOINT", builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? string.Empty)
        .WithEnvironment("OTEL_RESOURCE_ATTRIBUTES__service.name", builder.Configuration["OTEL_SERVICE_NAME"] ?? string.Empty);

        return api;
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
