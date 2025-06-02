// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.Extensions.RateLimit;
using BjjEire.Api.IntegrationTests.GymController;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Infrastructure.Data.Mongo;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Testcontainers.MongoDb;
using Xunit;

namespace BjjEire.Api.IntegrationTests;

public class StrictRateLimitTestApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
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
                {"RateLimitOptions:EnableRateLimiting", "true" },
                {"RateLimitOptions:PermitLimit", "2"},
                {"RateLimitOptions:WindowInSeconds", "10" },
                {"RateLimitOptions:RejectionStatusCode", "429" },
        });

    });


    builder.ConfigureTestServices(services =>
    {
      services.RemoveAll<IMongoClient>();
      services.RemoveAll<IMongoDatabase>();
      services.RemoveAll<IDatabaseContext>();
      services.RemoveAll(typeof(IRepository<>));

      services.AddSingleton<IMongoClient>(sp =>
          {
            var clientSettings = MongoClientSettings.FromConnectionString(_dbContainer.GetConnectionString());
            return new MongoClient(clientSettings);
          });

      services.AddScoped<IMongoDatabase>(sp =>
          {
            var client = sp.GetRequiredService<IMongoClient>();
            var mongoUrl = MongoUrl.Create(_dbContainer.GetConnectionString());
            var databaseName = string.IsNullOrWhiteSpace(mongoUrl.DatabaseName) ? DefaultTestDatabaseName : mongoUrl.DatabaseName;
            return client.GetDatabase(databaseName);
          });

      services.AddScoped<IDatabaseContext, MongoDBContext>();
      services.AddScoped(typeof(IRepository<>), typeof(MongoRepository<>));

      services.RemoveAll<IHostedService>();
    });
  }

  public async Task InitializeAsync()
  {
    await _dbContainer.StartAsync().ConfigureAwait(false);
  }

  public new async Task DisposeAsync()
  {
    await _dbContainer.StopAsync().ConfigureAwait(false);
    await _dbContainer.DisposeAsync().ConfigureAwait(false);
    await base.DisposeAsync().ConfigureAwait(false);
  }
}
