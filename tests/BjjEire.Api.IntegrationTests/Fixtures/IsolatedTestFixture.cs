// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Reflection;
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
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.Fixtures;

public class IsolatedTestFixture : IAsyncLifetime {
   private readonly WebApplicationFactory<Program> _factory;
    private readonly MongoDbContainer _dbContainer;
    private readonly ILogger<IsolatedTestFixture> _logger;
    private readonly string _databaseName = $"bjjeire_it_{Guid.NewGuid():N}";
    public IsolatedTestContext Context { get; private set; }

    public IsolatedTestFixture()
    {
        // Initialize MongoDB container
        _dbContainer = new MongoDbBuilder()
            .WithImage("mongo:7.0")
            .WithUsername("testUserMongo")
            .WithPassword("testPassMongo")
            .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(MongoDbBuilder.MongoDbPort))
            .Build();

        // Initialize logger
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
        _logger = loggerFactory.CreateLogger<IsolatedTestFixture>();

        // Initialize WebApplicationFactory
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    { "ConnectionStrings:Mongodb", _dbContainer.GetConnectionString() },
                    { "RateLimitOptions:EnableRateLimiting", "false" }
                });
            });

            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IMongoClient>();
                services.RemoveAll<IMongoDatabase>();
                services.RemoveAll<IDatabaseContext>();
                services.RemoveAll(typeof(IRepository<>));
                services.RemoveAll<IHostedService>();

                services.AddSingleton<IMongoClient>(sp => new MongoClient(_dbContainer.GetConnectionString()));
                services.AddSingleton<IMongoDatabase>(sp => sp.GetRequiredService<IMongoClient>().GetDatabase(_databaseName));
                services.AddScoped<IDatabaseContext, MongoDBContext>();
                services.AddScoped(typeof(IRepository<>), typeof(MongoRepository<>));
                services.AddScoped<ITestDatabaseService, TestDatabaseService>();
                services.AddScoped<ITestHttpClientService, TestHttpClientService>();
            });
        });
    }

    public async Task InitializeAsync()
    {
        _logger.LogInformation("Starting MongoDB container for test.");
        await _dbContainer.StartAsync();
        Context = new IsolatedTestContext(_factory.CreateClient(), _factory.Services.GetRequiredService<IServiceScopeFactory>());
        _logger.LogInformation("Test fixture initialized.");
    }

    public async Task DisposeAsync()
    {
        _logger.LogInformation("Disposing test fixture.");
        await _dbContainer.StopAsync();
        await _dbContainer.DisposeAsync();
        await _factory.DisposeAsync();
        _logger.LogInformation("Test fixture disposed.");
    }

}

public record IsolatedTestContext(HttpClient Client, IServiceScopeFactory ScopeFactory)
{
    public ITestDatabaseService DatabaseService
    {
        get
        {
            using var scope = ScopeFactory.CreateScope();
            return scope.ServiceProvider.GetRequiredService<ITestDatabaseService>();
        }
    }

    public ITestHttpClientService HttpClientService
    {
        get
        {
            using var scope = ScopeFactory.CreateScope();
            return new TestHttpClientService(Client);
        }
    }
}
