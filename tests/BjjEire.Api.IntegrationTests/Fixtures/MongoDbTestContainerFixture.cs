    // Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
    // Licensed under the MIT License.

    using BjjEire.Api.IntegrationTests.Common;
    using DotNet.Testcontainers.Builders;
    using Testcontainers.MongoDb;
    using Microsoft.Extensions.Logging;
    using Serilog;
    using Xunit;

    namespace BjjEire.Api.IntegrationTests.Fixtures;

    public class MongoDbTestContainerFixture : IAsyncLifetime {

        private readonly MongoDbContainer _dbContainer;
        public TestApiFactory? Factory { get; private set; }
        private readonly ILogger<MongoDbTestContainerFixture> _logger;

        public MongoDbTestContainerFixture()
        {
            _logger = SerilogConfiguration.ConfigureGlobalLogger().CreateLogger<MongoDbTestContainerFixture>();
            _logger.LogInformation(TestLoggingEvents.Fixture.SetupStarting, "Defining new DatabaseContainerFixture.");

            _dbContainer = new MongoDbBuilder()
                .WithImage("mongo:7.0")
                .WithUsername("testUserMongo")
                .WithPassword("testPassMongo")
                .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(MongoDbBuilder.MongoDbPort))
                .Build();
        }

        public async Task InitializeAsync()
        {
            _logger.LogInformation(TestLoggingEvents.Fixture.ContainerStarting, "Starting container for test class...");
            await _dbContainer.StartAsync();
            _logger.LogInformation(TestLoggingEvents.Fixture.ContainerStarted, "Container started for test class. Initializing API factory...");

            Factory = new TestApiFactory(_dbContainer.GetConnectionString(), _logger);
        }

        public async Task DisposeAsync()
        {
            _logger.LogInformation(TestLoggingEvents.Fixture.TeardownStarting, "Disposing container for test class...");
            await _dbContainer.StopAsync();
            if (Factory != null)
            {
                await Factory.DisposeAsync();
            }
            _logger.LogInformation(TestLoggingEvents.Fixture.TeardownComplete, "Container for test class disposed.");
        }
    }
