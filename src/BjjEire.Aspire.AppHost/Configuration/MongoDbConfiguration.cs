using BjjEire.Aspire.AppHost.Constants;

using Microsoft.Extensions.Configuration;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class MongoDbConfiguration
{
    public static IResourceBuilder<MongoDBDatabaseResource> AddMongoDb(IDistributedApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        ContainerLifetime lifetime = builder.Configuration.GetValue<bool>("Testing:UseSessionLifetime", false)
            ? ContainerLifetime.Session
            : ContainerLifetime.Persistent;

        IResourceBuilder<ParameterResource> mongoUser = builder.AddParameter("mongo-user");
        IResourceBuilder<ParameterResource> mongoPassword = builder.AddParameter("mongo-password", secret: true);

        IResourceBuilder<MongoDBServerResource> mongo = builder.AddMongoDB("mongo", userName: mongoUser, password: mongoPassword)
            .WithLifetime(lifetime)
            .WithVolume(ServiceConstants.MongoDbVolume, "/data/db");

        return mongo.AddDatabase("Mongodb");
    }
}
