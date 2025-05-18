using Microsoft.Extensions.Configuration;
using BjjEire.Aspire.AppHost.Constants;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class ApiConfiguration {
    public static IResourceBuilder<ProjectResource> AddApi(
        IDistributedApplicationBuilder builder,
        IResourceBuilder<MongoDBServerResource> mongo) {
        ArgumentNullException.ThrowIfNull(builder);

        var api = builder.AddProject<Projects.BjjEire_Api>("api")
            .WithExternalHttpEndpoints()
            .WithHttpEndpoint(port: ServiceConstants.ApiHttpPort, targetPort: 80, name: "http")
            .WithHttpEndpoint(port: ServiceConstants.ApiHttpsPort, targetPort: 443, name: "https")
            .WithReference(mongo)
            .WaitFor(mongo)
            // .WithVolume(ServiceConstants.ApiLogsVolume, "/app/log")
            // .WithVolume(ServiceConstants.ApiCertsVolume, "/https", isReadOnly: true)
            .WithEnvironment("ASPNETCORE_ENVIRONMENT", builder.Configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production")
            .WithEnvironment("ASPNETCORE_URLS", builder.Configuration["ASPNETCORE_URLS"] ?? "https://+;http://+")
            .WithEnvironment("ASPNETCORE_HTTP_PORT", builder.Configuration["ASPNETCORE_HTTP_PORT"] ?? "80")
            .WithEnvironment("ASPNETCORE_HTTPS_PORT", builder.Configuration["ASPNETCORE_HTTPS_PORT"] ?? "443")
            .WithEnvironment("ASPNETCORE_Kestrel__Certificates__Default__Password", builder.Configuration["ASPNETCORE_KESTREL_CERT_PASSWORD"] ?? "")
            .WithEnvironment("ASPNETCORE_Kestrel__Certificates__Default__Path", builder.Configuration["ASPNETCORE_KESTREL_CERT_PATH"] ?? "")
            .WithEnvironment("ConnectionStrings__Mongodb", BuildMongoConnectionString(builder.Configuration))
            .WithEnvironment("CorsOptions__AllowedOrigins", builder.Configuration["CORS_ORIGINS"] ?? "")
            .WithEnvironment("Serilog__WriteTo__1__Args__serverUrl", builder.Configuration["SEQ_URL"] ?? "")
            .WithEnvironment("Serilog__WriteTo__2__Args__endpoint", builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "")
            .WithEnvironment("Serilog__Properties__Application", builder.Configuration["OTEL_SERVICE_NAME"] ?? "")
            .WithEnvironment("OTEL_EXPORTER_OTLP_ENDPOINT", builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "")
            .WithEnvironment("OTEL_RESOURCE_ATTRIBUTES__service.name", builder.Configuration["OTEL_SERVICE_NAME"] ?? "")
            .WithHealthCheck("/health");

        return api;
    }

    private static string BuildMongoConnectionString(ConfigurationManager configuration) {
        var user = configuration["MONGODB_USER"] ?? "admin";
        var password = configuration["MONGODB_PASSWORD"] ?? "password";
        var host = configuration["MONGODB_HOST"] ?? "mongodb";
        var port = configuration["MONGODB_PORT"] ?? "27017";
        var db = configuration["MONGODB_DB"] ?? "Mongodb";
        return $"mongodb://{user}:{password}@{host}:{port}/{db}?authSource=admin&authMechanism=SCRAM-SHA-256";
    }
}