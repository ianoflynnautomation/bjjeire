
using BjjEire.Aspire.AppHost.Constants;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class FrontendConfiguration {

    public static IResourceBuilder<ContainerResource> AddFrontend(
    IDistributedApplicationBuilder builder,
    IResourceBuilder<ContainerResource> api) {

        ArgumentNullException.ThrowIfNull(builder);

        var solutionRoot = Path.GetFullPath(Path.Combine(builder.AppHostDirectory, ServiceConstants.BasePath));
        var contextPath = solutionRoot;
        var dockerfilePath = Path.Combine(solutionRoot, "src/bjjeire-app/Dockerfile");

        var frontend = builder.AddDockerfile("frontend", contextPath, dockerfilePath)
        .WaitFor(api)
        .WithExternalHttpEndpoints()
        .WithHttpEndpoint(port: ServiceConstants.FrontendHttpPort, targetPort: 80)
        .WithHttpsEndpoint(port: ServiceConstants.FrontendHttpsPort, targetPort: 443, name: "https")
        .WithEnvironment("BROWSER", builder.Configuration["BROWSER"] ?? "none")
        .WithEnvironment("NODE_ENV", builder.Configuration["NODE_ENV"] ?? "production")
        .WithEnvironment("PORT", builder.Configuration["PORT"] ?? "80")
        .WithEnvironment("SERVICES_API_HTTP_0", builder.Configuration["SERVICES_API_HTTP_0"] ?? string.Empty)
        .WithEnvironment("SERVICES_API_HTTPS_0", builder.Configuration["SERVICES_API_HTTPS_0"] ?? string.Empty)
        .WithEnvironment("VITE_APP_API_URL", builder.Configuration["VITE_APP_API_URL"] ?? string.Empty)
        .WithEnvironment("VITE_APP_ENABLE_API_MOCKING", builder.Configuration["VITE_APP_ENABLE_API_MOCKING"] ?? string.Empty)
        .WithEnvironment("VITE_APP_MOCK_API_PORT", builder.Configuration["VITE_APP_MOCK_API_PORT"] ?? string.Empty)
        .WithEnvironment("VITE_APP_URL", builder.Configuration["VITE_APP_URL"] ?? string.Empty);

        return frontend;
    }
}
