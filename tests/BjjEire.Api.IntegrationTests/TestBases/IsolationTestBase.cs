// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Api.IntegrationTests.Interfaces;
using BjjEire.Api.IntegrationTests.Extensions;
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
    private ApiTestFixture _fixture = null!;
    private readonly ITestOutputHelper _output;
    protected ILogger Logger { get; }
    protected HttpClient HttpClient { get; private set; } = null!;
    protected ITestDatabaseService Database { get; private set; } = null!;
    protected ITestHttpClientService Http { get; private set; } = null!;
    protected ITestAuthService Auth { get; private set; } = null!;
    protected ITestAssertionService Assertions { get; private set; } = null!;

    public IsolationTestBase(ITestOutputHelper output)
    {
        _output = output;
        Logger = LoggingExtension.ConfigureTestLogger(_output);

    }

    public async Task InitializeAsync()
    {

        var test = (ITest)_output.GetType().GetField("test", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic)!.GetValue(_output)!;
        var testName = test.DisplayName;
        var correlationId = Guid.NewGuid();

        _logContext = Serilog.Context.LogContext.Push(
            new Serilog.Core.Enrichers.PropertyEnricher("TestName", testName),
            new Serilog.Core.Enrichers.PropertyEnricher("CorrelationId", correlationId)
        );

        Logger.LogInformation("Test execution started: {TestName}", testName);

        _fixture = new ApiTestFixture();
        await _fixture.InitializeAsync();

        HttpClient = _fixture.Factory.CreateClient();
        _scope = _fixture.Factory.Services.CreateScope();
        var serviceProvider = _scope.ServiceProvider;

        Database = serviceProvider.GetRequiredService<ITestDatabaseService>();
        Assertions = serviceProvider.GetRequiredService<ITestAssertionService>();

        Http = new TestHttpClientService(HttpClient);
        Auth = new TestAuthService(HttpClient, serviceProvider.GetRequiredService<ILogger<TestAuthService>>());

        Logger.LogInformation("Isolated fixture and services initialized successfully.");

    }

    public async Task DisposeAsync()
    {
        Logger.LogInformation(TestLoggingEvents.TestLifecycle.TestFinished, "Tearing down isolated fixture.");
        _logContext?.Dispose();
        _scope?.Dispose();
        HttpClient?.Dispose();

        if (_fixture != null)
        {
            await _fixture.DisposeAsync();
        }

        Logger.LogInformation("Isolated fixture torn down successfully.");
    }

}
