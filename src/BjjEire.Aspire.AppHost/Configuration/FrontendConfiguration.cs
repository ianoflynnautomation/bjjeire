using BjjEire.Aspire.AppHost.Constants;

using Microsoft.Extensions.Configuration;

namespace BjjEire.Aspire.AppHost.Configuration;

public static class FrontendConfiguration
{
    public static IResourceBuilder<ContainerResource> AddFrontend(
        IDistributedApplicationBuilder builder,
        IResourceBuilder<ContainerResource> api)
    {
        ArgumentNullException.ThrowIfNull(builder);

        string solutionRoot = Path.GetFullPath(Path.Combine(builder.AppHostDirectory, ServiceConstants.BasePath));
        string dockerfilePath = Path.Combine(solutionRoot, "src/bjjeire-app/Dockerfile");

        ConfigurationManager config = builder.Configuration;

        return builder.AddDockerfile("frontend", solutionRoot, dockerfilePath)
            .WaitFor(api)
            .WithExternalHttpEndpoints()
            .WithHttpEndpoint(port: ServiceConstants.FrontendHttpPort, targetPort: 80)
            .WithBuildArg("NODE_ENV", config["NODE_ENV"] ?? "production")
            .WithBuildArg("VITE_APP_MSAL_CLIENT_ID", config["VITE_APP_MSAL_CLIENT_ID"] ?? string.Empty)
            .WithBuildArg("VITE_APP_MSAL_AUTHORITY", config["VITE_APP_MSAL_AUTHORITY"] ?? string.Empty)
            .WithBuildArg("VITE_APP_MSAL_API_SCOPE", config["VITE_APP_MSAL_API_SCOPE"] ?? string.Empty)
            .WithBuildArg("VITE_APP_CF_BEACON_TOKEN", config["VITE_APP_CF_BEACON_TOKEN"] ?? string.Empty)
            .WithBuildArg("VITE_APP_APP_URL", config["VITE_APP_APP_URL"] ?? "http://localhost:60742")
            .WithBuildArg("VITE_APP_CONTACT_EMAIL", config["VITE_APP_CONTACT_EMAIL"] ?? "info@bjj-eire.com")
            .WithBuildArg("VITE_APP_SOCIAL_INSTAGRAM_URL", config["VITE_APP_SOCIAL_INSTAGRAM_URL"] ?? string.Empty)
            .WithBuildArg("VITE_APP_SOCIAL_FACEBOOK_URL", config["VITE_APP_SOCIAL_FACEBOOK_URL"] ?? string.Empty)
            .WithBuildArg("VITE_APP_GITHUB_URL", config["VITE_APP_GITHUB_URL"] ?? string.Empty)
            .WithEnvironment("SERVICES_API_HTTP_0", api.GetEndpoint("http"))
            .WithEnvironment("PORT", config["PORT"] ?? "80");
    }
}
