namespace BjjEire.Aspire.AppHost.Configuration;

public static class FrontendConfiguration {

    //public static IResourceBuilder<ContainerResource> AddFrontend(
    public static IResourceBuilder<NodeAppResource> AddFrontend(
        IDistributedApplicationBuilder builder,
        //IResourceBuilder<ContainerResource> api) {
        IResourceBuilder<ProjectResource> api) {

        ArgumentNullException.ThrowIfNull(builder);

        // var contextPath = Path.Combine("");
        // var dockerfilePath = Path.Combine(contextPath, "");
        // var frontend = builder.AddDockerfile("react", dockerfilePath)

        var frontend = builder.AddNpmApp("react", "../../bjjworld-app")
        .WithReference(api)
        .WaitFor(api)
        .WithExternalHttpEndpoints()
        // .WithHttpEndpoint(port: ServiceConstants.FrontendHttpPort, targetPort: 80,)
        // .WithHttpEndpoint(port: ServiceConstants.FrontendHttpsPort, targetPort: 443)
        .WithEnvironment("BROWSER", builder.Configuration["BROWSER"] ?? "none")
        .WithEnvironment("NODE_ENV", builder.Configuration["NODE_ENV"] ?? "production")
        .WithEnvironment("PORT", builder.Configuration["PORT"] ?? "80")
        .WithEnvironment("SERVICES_API_HTTP_0", builder.Configuration["SERVICES_API_HTTP_0"] ?? "")
        .WithEnvironment("SERVICES_API_HTTPS_0", builder.Configuration["SERVICES_API_HTTPS_0"] ?? "")
        .WithEnvironment("VITE_APP_API_URL", builder.Configuration["VITE_APP_API_URL"] ?? "")
        .WithEnvironment("VITE_APP_ENABLE_API_MOCKING", builder.Configuration["VITE_APP_ENABLE_API_MOCKING"] ?? "")
        .WithEnvironment("VITE_APP_MOCK_API_PORT", builder.Configuration["VITE_APP_MOCK_API_PORT"] ?? "")
        .WithEnvironment("VITE_APP_URL", builder.Configuration["VITE_APP_URL"] ?? "")
        .WithEnvironment("VITE_APP_PAGE_SIZE", builder.Configuration["VITE_APP_PAGE_SIZE"] ?? "")
        //.WithHealthCheck("/health")
        .PublishAsDockerFile();

        return frontend;
    }
}