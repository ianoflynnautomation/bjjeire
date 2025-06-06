// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Services;
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

namespace BjjEire.Api.IntegrationTests.Fixtures;

public class TestApiFactory : WebApplicationFactory<Program>
{
    private readonly string _connectionString;
    private readonly ILogger _logger;
    public readonly string DatabaseName = $"bjjeire_it_{Guid.NewGuid():N}";

    public TestApiFactory(string connectionString, ILogger logger)
    {
        _connectionString = connectionString;
        _logger = logger;
        _logger.LogInformation("TestApiFactory created for database: {DatabaseName}", DatabaseName);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "ConnectionStrings:Mongodb", _connectionString },
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

            services.AddSingleton<IMongoClient>(_ => new MongoClient(_connectionString));
            services.AddSingleton<IMongoDatabase>(sp => sp.GetRequiredService<IMongoClient>().GetDatabase(DatabaseName));
            services.AddScoped<IDatabaseContext, MongoDBContext>();
            services.AddScoped(typeof(IRepository<>), typeof(MongoRepository<>));

            services.AddScoped<ITestDatabaseService, TestDatabaseService>();
        });
    }
}
