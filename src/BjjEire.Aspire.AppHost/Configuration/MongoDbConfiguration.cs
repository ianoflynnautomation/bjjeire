using BjjEire.Aspire.AppHost.Constants;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class MongoDbConfiguration
{
    public static IResourceBuilder<MongoDBDatabaseResource> AddMongoDb(IDistributedApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        var mongo = builder.AddMongoDB("mongo")
            .WithLifetime(ContainerLifetime.Persistent)
            .WithVolume(ServiceConstants.MongoDbVolume, "/data/db")
            .WithHttpEndpoint(port: ServiceConstants.MongoDbPort, targetPort: 27017, name: "mongodb")
            .WithEnvironment("MONGO_INITDB_ROOT_USERNAME", builder.Configuration["MONGODB_USER"] ?? "admin")
            .WithEnvironment("MONGO_INITDB_ROOT_PASSWORD", builder.Configuration["MONGODB_PASSWORD"] ?? "password");

        return mongo.AddDatabase("Mongodb");
    }
}
