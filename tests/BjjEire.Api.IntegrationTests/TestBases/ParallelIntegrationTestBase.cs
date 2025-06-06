// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Api.IntegrationTests.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.TestBases;

public abstract class ParallelIntegrationTestBase : ApiIntegrationTestBase, IClassFixture<TestContainerFixture>, IAsyncLifetime
{
    private readonly TestContainerFixture _fixture;
    protected readonly ITestOutputHelper Output;
    protected ITestDatabaseService DatabaseService = null!;
    protected ITestHttpClientService HttpService = null!;

    protected ParallelIntegrationTestBase(TestContainerFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        Output = output;

        // Logger can be created in the constructor.
        var loggerFactory = LoggerFactory.Create(builder => builder.AddXunit(Output));
        Logger = loggerFactory.CreateLogger(GetType());

        // Defer initialization of Factory-dependent services to InitializeAsync
    }

    public async Task InitializeAsync()
    {
        // The fixture's InitializeAsync has already run, so the Factory is now available.
        HttpClient = _fixture.Factory.CreateClient();

        // Resolve services that depend on the factory
        var scope = _fixture.Factory.Services.CreateScope();
        DatabaseService = scope.ServiceProvider.GetRequiredService<ITestDatabaseService>();
        HttpService = new TestHttpClientService(HttpClient);

        BeginTestScope(Output);
        await DatabaseService.ClearCollectionsAsync();
    }

    public Task DisposeAsync()
    {
        EndTestScope();
        return Task.CompletedTask;
    }
}
