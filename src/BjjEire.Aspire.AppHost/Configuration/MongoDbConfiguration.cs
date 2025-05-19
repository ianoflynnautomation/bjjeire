using BjjEire.Aspire.AppHost.Constants;
using Microsoft.Extensions.Configuration;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class MongoDbConfiguration {
    public static IResourceBuilder<MongoDBDatabaseResource> AddMongoDb(IDistributedApplicationBuilder builder) {
        ArgumentNullException.ThrowIfNull(builder);

        var mongo = builder.AddMongoDB("mongo")
            .WithLifetime(ContainerLifetime.Persistent)
            .WithVolume(ServiceConstants.MongoDbVolume, "/data/db")
            .WithHttpEndpoint(port: ServiceConstants.MongoDbPort, targetPort: 27017, name: "mongodb")
            .WithEnvironment("MONGO_INITDB_ROOT_USERNAME", builder.Configuration["MONGODB_USER"] ?? "admin")
            .WithEnvironment("MONGO_INITDB_ROOT_PASSWORD", builder.Configuration["MONGODB_PASSWORD"] ?? "password");
            //.WithHealthCheck("echo 'db.runCommand(\"ping\").ok' | mongosh localhost:27017/test --quiet");

       var mongodb = mongo.AddDatabase("Mongodb");

        // Add MongoDB Exporter
        _ = builder.AddContainer("mongo-exporter", "percona/mongodb_exporter:0.44")
            .WithHttpEndpoint(port: 9216, targetPort: 9216, name: "metrics")
            .WithEnvironment("MONGODB_URI", BuildMongoConnectionString(builder.Configuration))
            .WithReference(mongo)
            .WaitFor(mongo);

        return mongodb;
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