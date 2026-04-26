// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using DotNet.Testcontainers.Builders;

using Testcontainers.MongoDb;

namespace BjjEire.Core.Fixtures;

public class MongoDbTestContainerFixture : DatabaseBaseFixture<MongoDbContainer>
{

    public MongoDbTestContainerFixture()
    {

        Container = new MongoDbBuilder("mongo:7.0")
            .WithUsername("testUserMongo")
            .WithPassword("testPassMongo")
            .WithWaitStrategy(Wait.ForUnixContainer()
                .UntilCommandIsCompleted("mongosh", "--eval", "db.adminCommand('ping')"))
            .Build();
    }

    public string ConnectionString => Container.GetConnectionString();

    public override async Task StartContainerAsync() => await Container.StartAsync().ConfigureAwait(false);

    public override async Task StopContainerAsync() => await Container.StopAsync().ConfigureAwait(false);

    public override async Task DisposeAsync() => await Container.DisposeAsync().ConfigureAwait(false);
}
