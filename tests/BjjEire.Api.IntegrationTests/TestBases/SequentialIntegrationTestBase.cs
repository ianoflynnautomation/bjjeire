// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Api.IntegrationTests.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Testcontainers.MongoDb;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.TestBases;

[Collection("Sequential")]
public abstract class SequentialIntegrationTestBase : ApiIntegrationTestBase, IAsyncLifetime
{
    private MongoDbContainer _dbContainer = null!;
    private TestApiFactory _factory = null!;
    protected readonly ITestOutputHelper Output;
    protected ITestDatabaseService DatabaseService = null!;
    protected ITestHttpClientService HttpService = null!;

    protected SequentialIntegrationTestBase(ITestOutputHelper output)
    {
        Output = output;
    }

    public async Task InitializeAsync()
    {
        var loggerFactory = LoggerFactory.Create(builder => builder.AddXunit(Output));
        Logger = loggerFactory.CreateLogger(GetType()); // Initialize logger first

        _dbContainer = new MongoDbBuilder().WithImage("mongo:7.0").Build();
        await _dbContainer.StartAsync();

        _factory = new TestApiFactory(_dbContainer.GetConnectionString(), Logger);
        HttpClient = _factory.CreateClient(); // Initialize HttpClient

        var scope = _factory.Services.CreateScope();
        DatabaseService = scope.ServiceProvider.GetRequiredService<ITestDatabaseService>();
        HttpService = new TestHttpClientService(HttpClient);

        BeginTestScope(Output); // Start logging scope after all setup
    }

    public async Task DisposeAsync()
    {
        EndTestScope();
        await _dbContainer.StopAsync();
        await _factory.DisposeAsync();
    }
}
