// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;
using Testcontainers.MongoDb;
using Xunit;

namespace BjjEire.Api.IntegrationTests.Fixtures;

public class TestContainerFixture : IAsyncLifetime
{
    private readonly MongoDbContainer _dbContainer;
    public TestApiFactory? Factory { get; private set; }
    private readonly ILogger<TestContainerFixture> _logger;

    public TestContainerFixture()
    {
        var loggerFactory = LoggerFactory.Create(builder => builder.AddSimpleConsole(o =>
        {
            o.IncludeScopes = true;
            o.SingleLine = true;
            o.TimestampFormat = "HH:mm:ss ";
        }));
        _logger = loggerFactory.CreateLogger<TestContainerFixture>();

        _logger.LogInformation("Defining new DatabaseContainerFixture.");
        _dbContainer = new MongoDbBuilder()
            .WithImage("mongo:7.0")
            .WithUsername("testUserMongo")
            .WithPassword("testPassMongo")
            .Build();

    }

    public async Task InitializeAsync()
    {
        _logger.LogInformation("Starting container for test class...");
        await _dbContainer.StartAsync();
        _logger.LogInformation("Container started for test class. Initializing API factory...");

        Factory = new TestApiFactory(_dbContainer.GetConnectionString(), _logger);
    }

    public async Task DisposeAsync()
    {
        _logger.LogInformation("Disposing container for test class...");
        await _dbContainer.StopAsync();
        if (Factory != null)
        {
            await Factory.DisposeAsync();
        }
        _logger.LogInformation("Container for test class disposed.");
    }
}
