// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Common;
using Microsoft.Extensions.Logging;
using Xunit;

namespace BjjEire.Api.IntegrationTests.Fixtures;

public class ApiTestFixture: IAsyncLifetime
{
    private readonly ILogger<ApiTestFixture> _logger = SerilogConfiguration.ConfigureGlobalLogger().CreateLogger<ApiTestFixture>();
    private readonly MongoDbTestContainerFixture _dbContainerFixture = new();
    public CustomWebApplicationFactory Factory { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        _logger.LogInformation(TestLoggingEvents.Fixture.ContainerStarting, "Starting container for test class...");
        await _dbContainerFixture.StartContainerAsync();
        _logger.LogInformation(TestLoggingEvents.Fixture.ContainerStarted,
            "Container started for test class. Initializing API factory...");
        Factory = new CustomWebApplicationFactory(_dbContainerFixture.ConnectionString, _logger);
        _logger.LogInformation("API Test Fixture initialized.");
    }

    public async Task DisposeAsync()
    {
        _logger.LogInformation("Disposing API Test Fixture...");
        if (Factory != null)
        {
            await Factory.DisposeAsync();
        }
        await _dbContainerFixture.StopContainerAsync();
        await _dbContainerFixture.DisposeAsync();
        _logger.LogInformation("API Test Fixture disposed.");
    }
}
