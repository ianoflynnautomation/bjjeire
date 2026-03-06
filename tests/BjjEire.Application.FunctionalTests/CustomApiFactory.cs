using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.FunctionalTests.Common;
using BjjEire.Infrastructure.Data.Mongo;
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

namespace BjjEire.Application.FunctionalTests;

public class CustomApiFactory : WebApplicationFactory<Program>, IAsyncLifetime {
    private const string MongoImage = "mongo:6.0";
    private const string MongoUsername = "testUserMongo";
    private const string MongoPassword = "testPassMongo";
    private const string MongoConnectionStringKey = "ConnectionStrings:Mongodb";
    private const string DefaultTestDatabaseName = "bjjworld_ft";

    private readonly ILogger<CustomApiFactory> _fixtureLogger;

    private readonly MongoDbContainer _dbContainer = new MongoDbBuilder()
        .WithImage(MongoImage)
        .WithUsername(MongoUsername)
        .WithPassword(MongoPassword)
        .Build();
    public CustomApiFactory() {
        var loggerFactory = LoggerFactory.Create(builder => _ = builder
                .AddFilter("Microsoft", LogLevel.Warning)
                .AddFilter("System", LogLevel.Warning)
                .AddFilter(typeof(CustomApiFactory).FullName, LogLevel.Information)
                .AddDebug()
                .AddSimpleConsole(options => {
                    options.IncludeScopes = false;
                    options.SingleLine = true;
                    options.TimestampFormat = "[FIXTURE HH:mm:ss] ";
                }));
        _fixtureLogger = loggerFactory.CreateLogger<CustomApiFactory>();
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.SetupStarting, "CustomApiFactory instance created.");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder) {
        _fixtureLogger.LogInformation("Configuring WebHost for integration tests...");
        _ = builder.UseEnvironment("Development");


        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.AppConfigurationModifying, "Modifying app configuration for tests (MongoDB ConnectionString, RateLimiting).");
        _ = builder.ConfigureAppConfiguration((context, config) => {
            var mongoConnectionString = _dbContainer.GetConnectionString();
            _fixtureLogger.LogInformation("Overriding MongoDB connection string with Testcontainer: {MongoConnectionString}", mongoConnectionString);
            _ = config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                { MongoConnectionStringKey, mongoConnectionString },
                {"RateLimitOptions:EnableRateLimiting", "false" },
            });
        });

        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.TestServicesConfiguring, "Configuring test services (replacing MongoDB services, removing IHostedService instances).");
        _ = builder.ConfigureTestServices(services => {
            _ = services.RemoveAll<IMongoClient>();
            _ = services.RemoveAll<IMongoDatabase>();
            _ = services.RemoveAll<IDatabaseContext>();
            _ = services.RemoveAll(typeof(IRepository<>));

            _ = services.AddSingleton<IMongoClient>(sp => {
                var clientSettings = MongoClientSettings.FromConnectionString(_dbContainer.GetConnectionString());
                return new MongoClient(clientSettings);
            });

            _ = services.AddScoped<IMongoDatabase>(sp => {
                var client = sp.GetRequiredService<IMongoClient>();
                var mongoUrl = MongoUrl.Create(_dbContainer.GetConnectionString());
                var databaseName = string.IsNullOrWhiteSpace(mongoUrl.DatabaseName) ? DefaultTestDatabaseName : mongoUrl.DatabaseName;
                _fixtureLogger.LogDebug("Providing IMongoDatabase: {DatabaseName} from Testcontainer.", databaseName);
                return client.GetDatabase(databaseName);
            });

            _ = services.AddScoped<IDatabaseContext, MongoDBContext>();
            _ = services.AddScoped(typeof(IRepository<>), typeof(MongoRepository<>));

            _fixtureLogger.LogInformation("Removing all IHostedService implementations for test run.");
            _ = services.RemoveAll<IHostedService>();
        });
        _fixtureLogger.LogInformation("WebHost configuration for integration tests complete.");
    }

    public virtual async Task InitializeAsync() {
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.ContainerStarting, "Starting MongoDB Testcontainer ({MongoImage})...", MongoImage);
        await _dbContainer.StartAsync().ConfigureAwait(false);
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.ContainerStarted, "MongoDB Testcontainer started. ConnectionString (check logs if sensitive): {MongoConnectionString}", _dbContainer.GetConnectionString());
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.SetupComplete, "CustomApiFactory InitializeAsync complete.");
    }

    public new virtual async Task DisposeAsync() {
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.TeardownStarting, "CustomApiFactory DisposeAsync starting...");
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.ContainerStopping, "Stopping MongoDB Testcontainer...");
        await _dbContainer.StopAsync().ConfigureAwait(false);
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.ContainerStopped, "MongoDB Testcontainer stopped.");
        await _dbContainer.DisposeAsync().ConfigureAwait(false);
        _fixtureLogger.LogInformation(TestLoggingEvents.Fixture.TeardownComplete, "CustomApiFactory DisposeAsync complete.");
        await base.DisposeAsync();
    }
}
