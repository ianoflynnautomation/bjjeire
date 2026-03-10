using Aspire.Hosting;
using Aspire.Hosting.Testing;

using Xunit;

namespace BjjEire.Api.IntegrationTests.Fixtures;

/// <summary>
/// Starts the full Aspire AppHost (MongoDB + API containers) for smoke testing.
/// Requires Docker. Tests using this fixture are slower than WebApplicationFactory tests.
/// Run with: dotnet test --filter Category=Smoke
/// </summary>
public sealed class AppHostFixture : IAsyncLifetime
{
    private DistributedApplication? _app;

    public HttpClient ApiClient { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        var appHost = await DistributedApplicationTestingBuilder
            .CreateAsync<Projects.BjjEire_Aspire_AppHost>();

        _app = await appHost.BuildAsync();
        await _app.StartAsync();

        ApiClient = _app.CreateHttpClient("api");
    }

    public async Task DisposeAsync()
    {
        ApiClient?.Dispose();
        if (_app is not null)
            await _app.DisposeAsync();
    }
}
