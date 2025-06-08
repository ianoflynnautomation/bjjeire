// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Reflection;
using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Api.IntegrationTests.Services;
using BjjEire.Api.IntegrationTests.Validations;
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
    private readonly ApiTestFixture _fixture;
    private readonly ITestOutputHelper _output;
    private IServiceScope _scope = null!;
    private IDisposable? _logContext;
    protected ILogger Logger { get; }
    protected HttpClient HttpClient { get; }
    protected ITestDatabaseService Database { get; private set; } = null!;
    protected ITestHttpClientService Http { get; private set; } = null!;

    protected ApiIntegrationTestBase(ApiTestFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        _output = output;
        Logger = SerilogConfiguration.ConfigureTestLogger(output);
        HttpClient = _fixture.Factory.CreateClient();
    }

    public virtual async Task InitializeAsync()
    {
        BeginTestScope(_output);
        _scope = _fixture.Factory.Services.CreateScope();

        Database = _scope.ServiceProvider.GetRequiredService<ITestDatabaseService>();
        Http = new TestHttpClientService(HttpClient);

        Logger.LogInformation("Clearing database for test...");
        await Database.ClearCollectionsAsync();
        Logger.LogInformation("Database cleared. Test initialized.");

    }

    public virtual Task DisposeAsync()
    {
        EndTestScope();
        _scope?.Dispose();
        HttpClient?.Dispose();
        return Task.CompletedTask;
    }


    protected void BeginTestScope(ITestOutputHelper output)
    {
        var test = (ITest)output.GetType().GetField("test", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(output)!;
        var testName = test.DisplayName;
        var correlationId = Guid.NewGuid();

        _logContext = LogContext.Push(
            new PropertyEnricher("TestName", testName),
            new PropertyEnricher("CorrelationId", correlationId)
        );

        Logger.LogInformation(TestLoggingEvents.TestLifecycle.TestStarted,
            "Test execution started: {TestName} | CorrelationId: {CorrelationId}", testName, correlationId);
    }

    protected void EndTestScope()
    {
        Logger.LogInformation(TestLoggingEvents.TestLifecycle.TestFinished, "Test execution scope finished.");
        _logContext?.Dispose();
    }

    protected Task<string> GetAuthTokenAsync(string userId = "dev-user@example.com", string role = "Admin", Dictionary<string, string>? customHeaders = null) =>
        ApiAuthTestHelpers.GetApiTokenAsync(HttpClient, Logger, userId, role, customHeaders);

    protected void SetAuthToken(string token) =>
        ApiAuthTestHelpers.SetHttpClientAuthToken(HttpClient, Logger, token);

    protected Task SetDefaultUserAuthTokenAsync() =>
        ApiAuthTestHelpers.SetDefaultUserAuthTokenOnClientAsync(HttpClient, Logger);

    protected Task AssertValidationErrorAsync(HttpResponseMessage response, params (string Field, string? ErrorCode, string? MessageContains)[] expectedErrors) =>
        ApiValidationAssertion.AssertValidationErrorAsync(response, Logger, expectedErrors);

    protected Task AssertRateLimitHeadersAsync(HttpResponseMessage response, int expectedPermitLimit, int expectedWindowInSeconds, string expectedRemaining = "0") =>
        RateLimitAssertion.AssertRateLimitHeadersAsync(Logger, response, expectedPermitLimit, expectedWindowInSeconds, expectedRemaining);

    protected Task AssertRateLimitProblemDetailsAsync(HttpResponseMessage response, int expectedStatusCode, int expectedPermitLimit, int expectedWindowInSeconds) =>
        RateLimitAssertion.AssertRateLimitProblemDetailsAsync(Logger, response, expectedStatusCode, expectedPermitLimit, expectedWindowInSeconds);
}
