using System.Net;

using BjjEire.Api.IntegrationTests.Fixtures;

using Shouldly;

using Xunit;

namespace BjjEire.Api.IntegrationTests.AppHost;

/// <summary>
/// Smoke tests that start the full Aspire-orchestrated stack.
/// Requires Docker. Run with: dotnet test --filter Category=Smoke
/// </summary>
[Trait("Category", "Smoke")]
public sealed class AppHostHealthTests(AppHostFixture fixture) : IClassFixture<AppHostFixture>
{
    [Fact]
    public async Task Api_HealthEndpoint_ReturnsHealthy()
    {
        var response = await fixture.ApiClient.GetAsync("/health");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Api_LivenessEndpoint_ReturnsHealthy()
    {
        var response = await fixture.ApiClient.GetAsync("/alive");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }
}
