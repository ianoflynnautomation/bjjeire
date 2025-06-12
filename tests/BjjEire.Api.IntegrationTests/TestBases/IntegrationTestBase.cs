// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Reflection;
using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Api.IntegrationTests.Extensions;
using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Api.IntegrationTests.Services;
using BjjEire.Api.IntegrationTests.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog.Context;
using Serilog.Core.Enrichers;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.TestBases;

public abstract class ApiIntegrationTestBase: IAsyncLifetime
{
    private readonly IServiceScope _scope;
    private IDisposable? _logContext;
    private readonly ITestOutputHelper _output;
    protected ILogger Logger { get; }
    protected HttpClient HttpClient { get; }
    protected ITestDatabaseService Database { get; }
    protected ITestHttpClientService Http { get; }
    protected ITestAuthService Auth { get; }
    protected ITestAssertionService Assertions { get; }

    protected ApiIntegrationTestBase(ApiTestFixture fixture, ITestOutputHelper output)
    {
        _output = output;
        HttpClient = fixture.Factory.CreateClient();
        Logger = LoggingExtension.ConfigureTestLogger(_output);

        _scope = fixture.Factory.Services.CreateScope();
        var serviceProvider = _scope.ServiceProvider;

        Database = serviceProvider.GetRequiredService<ITestDatabaseService>();
        Assertions = serviceProvider.GetRequiredService<ITestAssertionService>();

        Http = new TestHttpClientService(HttpClient);
        Auth = new TestAuthService(HttpClient, serviceProvider.GetRequiredService<ILogger<TestAuthService>>());
    }

    public virtual async Task InitializeAsync()
    {
        var test = (ITest) _output.GetType().GetField("test", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(_output)!;
        var testName = test.DisplayName;
        var correlationId = Guid.NewGuid();

        _logContext = LogContext.Push(
            new PropertyEnricher("TestName", testName),
            new PropertyEnricher("CorrelationId", correlationId)
        );

        Logger.LogInformation(TestLoggingEvents.TestLifecycle.TestStarted,
            "Test execution started: {TestName} | CorrelationId: {CorrelationId}", testName, correlationId);

        Logger.LogInformation("Clearing database for test...");
        await Database.ClearCollectionsAsync();
        Logger.LogInformation("Database cleared. Test initialized.");
    }

    public virtual Task DisposeAsync()
    {
        Logger.LogInformation(TestLoggingEvents.TestLifecycle.TestFinished, "Test execution scope finished.");

        _logContext?.Dispose();
        _scope.Dispose();
        HttpClient.Dispose();

        return Task.CompletedTask;
    }

    protected Task AssertValidationErrorAsync(HttpResponseMessage response, params (string Field, string? ErrorCode, string? MessageContains)[] expectedErrors) =>
        Assertions.AssertValidationErrorAsync(response, expectedErrors);

    // protected Task AssertRateLimitHeadersAsync(HttpResponseMessage response, int expectedPermitLimit, int expectedWindowInSeconds, string expectedRemaining = "0") =>
    //     Assertions.AssertRateLimitHeadersAsync(response, expectedPermitLimit, expectedWindowInSeconds, expectedRemaining);
    //
    // protected Task AssertRateLimitProblemDetailsAsync(HttpResponseMessage response, int expectedStatusCode, int expectedPermitLimit, int expectedWindowInSeconds) =>
    //     Assertions.AssertRateLimitProblemDetailsAsync(response, expectedStatusCode, expectedPermitLimit, expectedWindowInSeconds);
}
