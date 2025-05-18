
namespace AppHost.Configuration;

public static class MongoDbConfiguration {
    public static IResourceBuilder<MongoDBServerResource> AddMongoDb(IDistributedApplicationBuilder builder) {
        var mongo = builder.AddMongoDB("mongo")
            .WithLifetime(ContainerLifetime.Persistent);
        _ = mongo.AddDatabase("Mongodb");
        return mongo;
    }
}
