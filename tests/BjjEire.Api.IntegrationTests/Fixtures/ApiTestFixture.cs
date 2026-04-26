// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Xunit;

namespace BjjEire.Api.IntegrationTests.Fixtures;

public class ApiTestFixture : IAsyncLifetime
{
    private readonly MongoDbTestContainerFixture _dbContainerFixture = new();
    public CustomWebApplicationFactory Factory { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await _dbContainerFixture.StartContainerAsync().ConfigureAwait(false);
        Factory = new CustomWebApplicationFactory(_dbContainerFixture.ConnectionString);
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync().ConfigureAwait(false);
        await _dbContainerFixture.StopContainerAsync().ConfigureAwait(false);
        await _dbContainerFixture.DisposeAsync().ConfigureAwait(false);
    }
}
