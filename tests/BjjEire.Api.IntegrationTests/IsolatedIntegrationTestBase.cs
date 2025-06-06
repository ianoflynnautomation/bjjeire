// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Reflection;
using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests;

[Trait("Category", "Integration-Isolated")]
[Collection("Non-Parallel")]
public abstract class IsolatedIntegrationTestBase : IAsyncLifetime
{
    private readonly ILogger _logger;
    private readonly ITestOutputHelper _outputHelper;
    private IDisposable? _testLogScope;

    protected IsolatedIntegrationTestBase(ITestOutputHelper outputHelper)
    {
        _outputHelper = outputHelper;
        var loggerFactory = LoggerFactory.Create(builder => builder.AddXunit(outputHelper));
        _logger = loggerFactory.CreateLogger(GetType());
    }


    protected async Task ExecuteInIsolationAsync(Func<IsolatedTestContext, Task> testAction)
    {
        await using var factory = new CustomApiFactory();
        await factory.InitializeAsync();

        var context = new IsolatedTestContext(factory.CreateClient(), factory.Services);

        _logger.LogInformation(TestLoggingEvents.TestLifecycle.TestStarted, "Executing test with a new, isolated factory and database.");

        await testAction(context);

        _logger.LogInformation(TestLoggingEvents.TestLifecycle.TestFinished, "Test execution finished, disposing isolated factory.");
    }

    protected Task SeedAsync<TEntity>(IServiceProvider services, params TEntity[] entities) where TEntity : BaseEntity
    {
        using var scope = services.CreateScope();
        return DatabaseHelper.SeedEntitiesAsync(scope.ServiceProvider, _logger, entities);
    }

    public Task InitializeAsync()
    {
        var test = (ITest)_outputHelper.GetType().GetField("test", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(_outputHelper)!;
        _testLogScope = _logger.BeginScope("Test: {TestName}", test.DisplayName);
        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        _testLogScope?.Dispose();
        return Task.CompletedTask;
    }

    public record IsolatedTestContext(HttpClient Client, IServiceProvider Services);
}
