using BjjEire.Aspire.AppHost.Constants;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class PostgresConfiguration {
    public static IResourceBuilder<ContainerResource> AddPostgres(
        IDistributedApplicationBuilder builder) {
        ArgumentNullException.ThrowIfNull(builder);

        var postgres = builder.AddContainer("postgres-1", "postgres")
            .WithVolume("postgres_data_1", "/var/lib/postgresql/data")
            .WithBindMount($"{ServiceConstants.BasePath}infra/postgres/post_init.sh", "/scripts/post_init.sh")
            .WithBindMount($"{ServiceConstants.BasePath}infra/postgres/certs/server.crt", "/home/postgres/server.crt", true)
            .WithBindMount($"{ServiceConstants.BasePath}infra/postgres/certs/server.key", "/home/postgres/server.key", true)
            .WithHttpEndpoint(port: 6432, targetPort: 5432, name: "postgres")
            .WithHttpEndpoint(port: 8008, targetPort: 8008, name: "health")
            .WithEnvironment("GRAFANA_DB_NAME", builder.Configuration["POSTGRES_USER"] ?? "grafana")
            .WithEnvironment("GRAFANA_DB_USER", builder.Configuration["GF_DATABASE_USER"] ?? "grafana")
            .WithEnvironment("GRAFANA_DB_PASSWORD", builder.Configuration["GF_DATABASE_USER"] ?? "Grafana.12345")
            .WithHealthCheck("/health");

        return postgres;
    }
}