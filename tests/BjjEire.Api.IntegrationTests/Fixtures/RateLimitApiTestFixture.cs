// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using Xunit;

namespace BjjEire.Api.IntegrationTests.Fixtures;

public class RateLimitApiTestFixture : IAsyncLifetime
{
    private readonly MongoDbTestContainerFixture _dbContainerFixture = new();
    public RateLimitWebApplicationFactory Factory { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await _dbContainerFixture.StartContainerAsync();
        Factory = new RateLimitWebApplicationFactory(_dbContainerFixture.ConnectionString);
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();
        await _dbContainerFixture.StopContainerAsync();
        await _dbContainerFixture.DisposeAsync();
    }
}
