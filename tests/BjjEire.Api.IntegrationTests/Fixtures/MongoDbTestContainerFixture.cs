// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Common;
using DotNet.Testcontainers.Builders;
using Microsoft.Extensions.Logging;
using Testcontainers.MongoDb;
using Xunit;

namespace BjjEire.Api.IntegrationTests.Fixtures;

public class MongoDbTestContainerFixture : DatabaseBaseFixture<MongoDbTestContainerFixture>  {

    private readonly MongoDbContainer _dbContainer;
    private readonly ILogger<MongoDbTestContainerFixture> _logger;

    public MongoDbTestContainerFixture() {

        _logger = SerilogConfiguration.ConfigureGlobalLogger().CreateLogger<MongoDbTestContainerFixture>();

        _logger.LogInformation(TestLoggingEvents.Fixture.SetupStarting, "Defining new DatabaseContainerFixture.");

        _dbContainer = new MongoDbBuilder()
            .WithImage("mongo:7.0")
            .WithUsername("testUserMongo")
            .WithPassword("testPassMongo")
            .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(MongoDbBuilder.MongoDbPort))
            .Build();
    }

    public string ConnectionString => _dbContainer.GetConnectionString();

    public override async Task StartContainerAsync()
    {
        _logger.LogInformation(TestLoggingEvents.Fixture.ContainerStarting, "Starting container for test class...");
        await _dbContainer.StartAsync();
        _logger.LogInformation(TestLoggingEvents.Fixture.ContainerStarted, "Container started for test class. Initializing API factory...");

    }

    public override async Task StopContainerAsync() {
        _logger.LogInformation(TestLoggingEvents.Fixture.TeardownStarting, "Stoping container for test class...");
        await _dbContainer.StopAsync();
        _logger.LogInformation(TestLoggingEvents.Fixture.TeardownComplete, "Container for test class stoped.");

    }

    public override async Task DisposeAsync()
    {
        _logger.LogInformation(TestLoggingEvents.Fixture.TeardownStarting, "Disposing container for test class...");
        await _dbContainer.DisposeAsync();
        _logger.LogInformation(TestLoggingEvents.Fixture.TeardownComplete, "Container for test class disposed.");

    }
}
