using BjjEire.Application.Common.Interfaces;
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

namespace BjjEire.Api.IntegrationTests;

public class CustomApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private const string MongoImage = "mongo:6.0";
    private const string MongoUsername = "testUserMongo";
    private const string MongoPassword = "testPassMongo";
    private const string MongoConnectionStringKey = "ConnectionStrings:Mongodb";
    private const string DefaultTestDatabaseName = "bjjworld_it";

    private readonly MongoDbContainer _dbContainer = new MongoDbBuilder()
        .WithImage(MongoImage)
        .WithUsername(MongoUsername)
        .WithPassword(MongoPassword)
        // add a wait strategy if startup is sometimes problematic
        // .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(27017))
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
        });

        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                { MongoConnectionStringKey, _dbContainer.GetConnectionString() },
                {"RateLimitOptions:EnableRateLimiting", "false" },
            });

        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IMongoClient>();
            services.RemoveAll<IMongoDatabase>();
            services.RemoveAll<IDatabaseContext>();
            services.RemoveAll(typeof(IRepository<>));

            // Register services using the Testcontainer's MongoDB instance
            services.AddSingleton<IMongoClient>(sp =>
            {
                var clientSettings = MongoClientSettings.FromConnectionString(_dbContainer.GetConnectionString());
                // Add any specific client configurations if needed (e.g., command logging for debugging)
                return new MongoClient(clientSettings);
            });

            services.AddScoped<IMongoDatabase>(sp =>
            {
                var client = sp.GetRequiredService<IMongoClient>();
                var mongoUrl = MongoUrl.Create(_dbContainer.GetConnectionString());
                var databaseName = string.IsNullOrWhiteSpace(mongoUrl.DatabaseName) ? DefaultTestDatabaseName : mongoUrl.DatabaseName;
                return client.GetDatabase(databaseName);
            });

            // Re-register your application's DB context and repositories pointing to the test database
            // Ensure MongoDBContext is designed to take IMongoDatabase via DI
            services.AddScoped<IDatabaseContext, MongoDBContext>();
            services.AddScoped(typeof(IRepository<>), typeof(MongoRepository<>));

            // Remove any IHostedService implementations that might run during tests
            // (e.g., background workers, message queue listeners)
            services.RemoveAll<IHostedService>();
        });
    }

    public virtual async Task InitializeAsync()
    {
        await _dbContainer.StartAsync().ConfigureAwait(false);
        // Optional: If you need to ensure indexes or perform one-time DB setup for tests
        // var serviceProvider = Services;
        // using var scope = serviceProvider.CreateScope();
        // var dbContext = scope.ServiceProvider.GetRequiredService<IDatabaseContext>();
        // await dbContext.EnsureSchemaCreatedAndMigratedAsync(); // Or similar setup method
    }

    public virtual async Task DisposeAsync()
    {
        await _dbContainer.StopAsync().ConfigureAwait(false);
        await _dbContainer.DisposeAsync().ConfigureAwait(false);
        await base.DisposeAsync().ConfigureAwait(false);
    }
}
