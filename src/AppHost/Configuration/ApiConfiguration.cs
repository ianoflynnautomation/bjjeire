
namespace AppHost.Configuration;

public static class ApiConfiguration {
    public static IResourceBuilder<ProjectResource> AddApi(
        IDistributedApplicationBuilder builder,
        IResourceBuilder<MongoDBServerResource> mongo) {
        return builder.AddProject<Projects.BjjEire_Api>("api")
            .WithExternalHttpEndpoints()
            .WithHttpEndpoint(port: 8080, targetPort: 80, name: "http")
            .WithHttpEndpoint(port: 8081, targetPort: 8081, name: "metrics") 
            .WithReference(mongo)
            .WaitFor(mongo);
    }
}