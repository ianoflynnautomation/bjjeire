// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using DotNet.Testcontainers.Builders;
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

    public override async Task StartContainerAsync() => await Container.StartAsync();

    public override async Task StopContainerAsync() => await Container.StopAsync();

    public override async Task DisposeAsync() => await Container.DisposeAsync();
}
