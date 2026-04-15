extern alias AppHost;

using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using Aspire.Hosting.Testing;

using Microsoft.Extensions.DependencyInjection;

using Xunit;

namespace BjjEire.Api.IntegrationTests.Fixtures;

/// <summary>
/// Starts the full Aspire AppHost (MongoDB + API containers) for smoke testing.
/// Requires Docker. Tests using this fixture are slower than WebApplicationFactory tests.
/// Run with: dotnet test --filter Category=Smoke
/// </summary>
public sealed class AppHostFixture : IAsyncLifetime
{
    private static readonly TimeSpan _startupTimeout = TimeSpan.FromMinutes(5);

    private DistributedApplication? _app;

    public HttpClient ApiClient { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        IDistributedApplicationTestingBuilder appHost = await DistributedApplicationTestingBuilder
            .CreateAsync<AppHost::Projects.BjjEire_Aspire_AppHost>();

        // Session lifetime: containers always start fresh so Running state events fire correctly.
        appHost.Configuration["Testing:UseSessionLifetime"] = "true";
        // Skip the frontend — smoke tests only need API + MongoDB.
        appHost.Configuration["Testing:SkipFrontend"] = "true";

        _app = await appHost.BuildAsync();

        ResourceNotificationService notifications = _app.Services.GetRequiredService<ResourceNotificationService>();

        await _app.StartAsync();

        await notifications
            .WaitForResourceAsync("api", KnownResourceStates.Running)
            .WaitAsync(_startupTimeout);

        ApiClient = _app.CreateHttpClient("api");
    }

    public async Task DisposeAsync()
    {
        ApiClient?.Dispose();
        if (_app is not null)
            await _app.DisposeAsync();
    }
}
