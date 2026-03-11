using BjjEire.Aspire.AppHost.Constants;

using Microsoft.Extensions.Configuration;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class MongoDbConfiguration
{
    public static IResourceBuilder<MongoDBDatabaseResource> AddMongoDb(IDistributedApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        var lifetime = builder.Configuration.GetValue<bool>("Testing:UseSessionLifetime", false)
            ? ContainerLifetime.Session
            : ContainerLifetime.Persistent;

        var mongoUser = builder.AddParameter("mongo-user");
        var mongoPassword = builder.AddParameter("mongo-password", secret: true);

        var mongo = builder.AddMongoDB("mongo", userName: mongoUser, password: mongoPassword)
            .WithLifetime(lifetime)
            .WithVolume(ServiceConstants.MongoDbVolume, "/data/db");

        return mongo.AddDatabase("Mongodb");
    }
}
