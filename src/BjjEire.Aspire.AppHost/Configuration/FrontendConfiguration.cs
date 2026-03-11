using BjjEire.Aspire.AppHost.Constants;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class FrontendConfiguration
{
    public static IResourceBuilder<ContainerResource> AddFrontend(
        IDistributedApplicationBuilder builder,
        IResourceBuilder<ContainerResource> api)
    {
        ArgumentNullException.ThrowIfNull(builder);

        var solutionRoot = Path.GetFullPath(Path.Combine(builder.AppHostDirectory, ServiceConstants.BasePath));
        var dockerfilePath = Path.Combine(solutionRoot, "src/bjjeire-app/Dockerfile");

        var certsPath = Path.Combine(solutionRoot, "certs");

        return builder.AddDockerfile("frontend", solutionRoot, dockerfilePath)
            .WaitFor(api)
            .WithExternalHttpEndpoints()
            .WithHttpEndpoint(port: ServiceConstants.FrontendHttpPort, targetPort: 80)
            .WithHttpsEndpoint(port: ServiceConstants.FrontendHttpsPort, targetPort: 443, name: "https")
            .WithBindMount(certsPath, "/etc/nginx/certs", isReadOnly: true)
            .WithBuildArg("NODE_ENV", builder.Configuration["NODE_ENV"] ?? "production")
            .WithBuildArg("SERVICES_API_HTTP_0", builder.Configuration["SERVICES_API_HTTP_0"] ?? string.Empty)
            .WithBuildArg("SERVICES_API_HTTPS_0", builder.Configuration["SERVICES_API_HTTPS_0"] ?? string.Empty)
            .WithBuildArg("VITE_APP_MSAL_CLIENT_ID", builder.Configuration["VITE_APP_MSAL_CLIENT_ID"] ?? string.Empty)
            .WithBuildArg("VITE_APP_MSAL_AUTHORITY", builder.Configuration["VITE_APP_MSAL_AUTHORITY"] ?? string.Empty)
            .WithBuildArg("VITE_APP_MSAL_API_SCOPE", builder.Configuration["VITE_APP_MSAL_API_SCOPE"] ?? string.Empty)
            .WithEnvironment("SERVICES_API_HTTPS_0", api.GetEndpoint("http"))
            .WithEnvironment("BROWSER", builder.Configuration["BROWSER"] ?? "none")
            .WithEnvironment("PORT", builder.Configuration["PORT"] ?? "80");
    }
}
