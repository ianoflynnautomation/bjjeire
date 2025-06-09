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
        await _dbContainerFixture.StartContainerAsync();
        Factory = new CustomWebApplicationFactory(_dbContainerFixture.ConnectionString);
        _logger.LogInformation("API Test Fixture initialized.");
    }

    public async Task DisposeAsync()
    {
        _logger.LogInformation("Disposing API Test Fixture...");
        await Factory.DisposeAsync();
        _logger.LogInformation("API Test Fixture disposed.");
        await _dbContainerFixture.StopContainerAsync();
        await _dbContainerFixture.DisposeAsync();
    }
}
