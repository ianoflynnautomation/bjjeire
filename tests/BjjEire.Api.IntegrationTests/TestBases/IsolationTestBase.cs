// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Interfaces;
using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Api.IntegrationTests.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.TestBases;

/// <summary>
/// An "isolation" base class for sequential integration tests.
/// It creates and destroys a new database container for each individual TEST METHOD.
/// Use this only for highly sensitive tests where performance is not a concern.
/// </summary>
[Collection("Sequential")]
public abstract class IsolationTestBase : IAsyncLifetime
{
    private IServiceScope _scope = null!;
    private IDisposable? _logContext;
    protected ILogger Logger { get; set; }
    protected HttpClient HttpClient { get; private set; } = null!;
    protected readonly ITestOutputHelper _output;
    protected ITestDatabaseService Database = null!;
    protected ITestHttpClientService Http = null!;
    private ApiTestFixture _fixture = null!;

    public async Task InitializeAsync()
    {
        Logger = SerilogConfiguration.ConfigureTestLogger(_output);

        BeginTestScope();

        _fixture = new ApiTestFixture();
        await _fixture.InitializeAsync();

        HttpClient = _fixture.Factory.CreateClient();
        _scope = _fixture.Factory.Services.CreateScope();

        // Resolve services from the new, isolated scope
        Database = _scope.ServiceProvider.GetRequiredService<ITestDatabaseService>();
        Http = new TestHttpClientService(HttpClient);

    }

    public async Task DisposeAsync()
    {
        EndTestScope();
        _scope?.Dispose();
        HttpClient?.Dispose();

        if (_fixture != null)
        {
            await _fixture.DisposeAsync();
        }
    }
    private void BeginTestScope()
    {
        var test = (ITest)_output.GetType().GetField("test", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic)!.GetValue(_output)!;
        var testName = test.DisplayName;
        var correlationId = Guid.NewGuid();

        _logContext = Serilog.Context.LogContext.Push(
            new Serilog.Core.Enrichers.PropertyEnricher("TestName", testName),
            new Serilog.Core.Enrichers.PropertyEnricher("CorrelationId", correlationId)
        );

        Logger.LogInformation("Test execution started: {TestName}", testName);
    }

    private void EndTestScope()
    {
        Logger.LogInformation("Test execution finished.");
        _logContext?.Dispose();
    }
}
