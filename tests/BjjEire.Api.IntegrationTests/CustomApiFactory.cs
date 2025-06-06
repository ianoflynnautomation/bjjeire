// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Api.IntegrationTests.Services;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Infrastructure.Data.Mongo;
using DotNet.Testcontainers.Builders;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Testcontainers.MongoDb;
using Xunit;

namespace BjjEire.Api.IntegrationTests;

public class CustomApiFactory : WebApplicationFactory<Program>, IAsyncLifetime {
    private readonly ILogger<CustomApiFactory> _fixtureLogger;
    private readonly string _databaseName = $"bjjeire_it_{Guid.NewGuid():N}";

    private readonly MongoDbContainer _dbContainer = new MongoDbBuilder()
        .WithImage("mongo:7.0")
        .WithUsername("testUserMongo")
        .WithPassword("testPassMongo")
        .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(MongoDbBuilder.MongoDbPort))
        //.WithReuse(true)
        .Build();

    public CustomApiFactory() {
        var loggerFactory = LoggerFactory.Create(builder => {
            _ = builder
                .AddFilter("Microsoft", LogLevel.Warning)
                .AddFilter("System", LogLevel.Warning)
                .AddSimpleConsole(options => {
                    options.IncludeScopes = true;
                    options.SingleLine = true;
                    options.TimestampFormat = "HH:mm:ss ";
                });
        });
        _fixtureLogger = loggerFactory.CreateLogger<CustomApiFactory>();
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.SetupStarting, "Creating CustomApiFactory instance.");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder) {
        _fixtureLogger.LogInformation("Configuring WebHost for integration tests...");
        _ = builder.UseEnvironment("Development");

        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.AppConfigurationModifying, "Modifying app configuration for tests (MongoDB ConnectionString, RateLimiting).");
        _ = builder.ConfigureAppConfiguration((_, config) => {
            var mongoConnectionString = _dbContainer.GetConnectionString();
            _fixtureLogger.LogInformation("Overriding MongoDB connection string with Testcontainer.");
            config.AddInMemoryCollection(new Dictionary<string, string?>
           {
                { "ConnectionStrings:Mongodb", mongoConnectionString },
                { "RateLimitOptions:EnableRateLimiting", "false" },
            });
        });

        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.TestServicesConfiguring, "Configuring test services and removing IHostedService instances.");
        _ = builder.ConfigureTestServices(services => {
            _ = services.RemoveAll<IMongoClient>();
            _ = services.RemoveAll<IMongoDatabase>();
            _ = services.RemoveAll<IDatabaseContext>();
            _ = services.RemoveAll(typeof(IRepository<>));
            _ = services.RemoveAll<IHostedService>();

            _ = services.AddSingleton<IMongoClient>(_ => new MongoClient(MongoClientSettings.FromConnectionString(_dbContainer.GetConnectionString())));

            _ = services.AddSingleton<IMongoDatabase>(sp => {
                var client = sp.GetRequiredService<IMongoClient>();
                _fixtureLogger.LogInformation("Providing IMongoDatabase: {DatabaseName} from Testcontainer.", _databaseName);
                //var mongoUrl = MongoUrl.Create(_dbContainer.GetConnectionString());
                //var databaseName = $"bjjeire_it_{Guid.NewGuid():N}";
                //_fixtureLogger.LogInformation("Providing IMongoDatabase: {DatabaseName} from Testcontainer.", databaseName);
                //var databaseName = string.IsNullOrWhiteSpace(mongoUrl.DatabaseName) ? DefaultTestDatabaseName : mongoUrl.DatabaseName;
                //_fixtureLogger.LogDebug("Providing IMongoDatabase: {DatabaseName} from Testcontainer.", databaseName);
                return client.GetDatabase(_databaseName);
            });

            _ = services.AddScoped<IDatabaseContext, MongoDBContext>();
            _ = services.AddScoped(typeof(IRepository<>), typeof(MongoRepository<>));
            services.AddScoped<ITestDatabaseService>(sp =>
                new TestDatabaseService(sp.GetRequiredService<IServiceScopeFactory>(), sp.GetRequiredService<ILogger<TestDatabaseService>>()));
            services.AddScoped<ITestHttpClientService, TestHttpClientService>();
        });
        _fixtureLogger.LogInformation("WebHost configuration for integration tests complete.");
    }

    public async Task InitializeAsync() {
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.ContainerStarting, "Starting MongoDB Testcontainer...");
        await _dbContainer.StartAsync();
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.ContainerStarted, "MongoDB Testcontainer started successfully.");
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.SetupComplete, "CustomApiFactory initialization complete.");
    }

    public new async Task DisposeAsync() {
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.TeardownStarting, "Disposing CustomApiFactory...");
        await _dbContainer.StopAsync();
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.ContainerStopped, "MongoDB Testcontainer stopped.");
        await base.DisposeAsync();
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.TeardownComplete, "CustomApiFactory disposal complete.");
    }
}
