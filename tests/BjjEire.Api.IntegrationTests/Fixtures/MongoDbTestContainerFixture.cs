// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Common;
using DotNet.Testcontainers.Builders;
using Microsoft.Extensions.Logging;
using Testcontainers.MongoDb;

namespace BjjEire.Api.IntegrationTests.Fixtures;

public class MongoDbTestContainerFixture : DatabaseBaseFixture<MongoDbContainer>  {

    public MongoDbTestContainerFixture() {

        Container = new MongoDbBuilder()
            .WithImage("mongo:7.0")
            .WithUsername("testUserMongo")
            .WithPassword("testPassMongo")
            .WithWaitStrategy(Wait.ForUnixContainer()
                .UntilPortIsAvailable(MongoDbBuilder.MongoDbPort))
            .Build();
    }

    public string ConnectionString => Container.GetConnectionString();

    public override async Task StartContainerAsync()
    {
        //_logger.LogInformation(TestLoggingEvents.Fixture.ContainerStarting, "Starting container for test class...");
        await Container.StartAsync();
        //_logger.LogInformation(TestLoggingEvents.Fixture.ContainerStarted, "Container started for test class. Initializing API factory...");
    }

    public override async Task StopContainerAsync() {
        //_logger.LogInformation(TestLoggingEvents.Fixture.TeardownStarting, "Stoping container for test class...");
        await Container.StopAsync();
        //_logger.LogInformation(TestLoggingEvents.Fixture.TeardownComplete, "Container for test class stoped.");
    }

    public override async Task DisposeAsync()
    {
        //_logger.LogInformation(TestLoggingEvents.Fixture.TeardownStarting, "Disposing container for test class...");
        await Container.DisposeAsync();
        //_logger.LogInformation(TestLoggingEvents.Fixture.TeardownComplete, "Container for test class disposed.");
    }
}
