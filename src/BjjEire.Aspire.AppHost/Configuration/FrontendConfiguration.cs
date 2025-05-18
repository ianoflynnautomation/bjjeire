
namespace BjjEire.Aspire.AppHost.Configuration;

public static class FrontendConfiguration {
    public static IResourceBuilder<NodeAppResource> AddFrontend(
        IDistributedApplicationBuilder builder,
        IResourceBuilder<ProjectResource> api) {
        return builder.AddNpmApp("react", "../bjjworld-app")
            .WithReference(api)
            .WaitFor(api)
            .WithEnvironment("BROWSER", "none")
            .WithExternalHttpEndpoints()
            .PublishAsDockerFile();
    }
}