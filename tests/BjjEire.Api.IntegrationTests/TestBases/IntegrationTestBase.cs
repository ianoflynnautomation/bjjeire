// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Net.Http.Headers;
using System.Reflection;

using BjjEire.Api.IntegrationTests.Fixtures;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using Serilog.Context;
using Serilog.Core.Enrichers;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.TestBases;

public abstract class ApiIntegrationTestBase : IAsyncLifetime
{
    private readonly IServiceScope _scope;
    private IDisposable? _logContext;
    private readonly ITestOutputHelper _output;
    protected ILogger Logger { get; }
    protected HttpClient HttpClient { get; }
    protected ITestDatabaseService Database { get; }

    protected ApiIntegrationTestBase(ApiTestFixture fixture, ITestOutputHelper output)
    {
        ArgumentNullException.ThrowIfNull(fixture);

        _output = output;
        HttpClient = fixture.Factory.CreateClient();
        Logger = LoggingExtension.ConfigureTestLogger(_output);

        _scope = fixture.Factory.Services.CreateScope();
        Database = _scope.ServiceProvider.GetRequiredService<ITestDatabaseService>();
    }

    protected void SetBearerToken(string token) =>
        HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    protected void SetDefaultUserToken() => SetBearerToken(TestTokenFactory.Generate());

    protected static async Task<T> ReadJsonAsync<T>(HttpResponseMessage response)
    {
        T? result = await response.Content.ReadFromJsonAsync<T>(TestJsonHelper.SerializerOptions).ConfigureAwait(false);
        return result!;
    }

    public virtual async Task InitializeAsync()
    {
        ITest test = (ITest)_output.GetType().GetField("test", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(_output)!;
        string testName = test.DisplayName;
        Guid correlationId = Guid.NewGuid();

        _logContext = LogContext.Push(
            new PropertyEnricher("TestName", testName),
            new PropertyEnricher("CorrelationId", correlationId)
        );

        Logger.LogInformation(TestLoggingEvents.TestLifecycle.TestStarted,
            "Test execution started: {TestName} | CorrelationId: {CorrelationId}", testName, correlationId);

        Logger.LogInformation("Clearing database for test...");
        await Database.ClearCollectionsAsync().ConfigureAwait(false);
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

    protected static Task AssertValidationErrorAsync(HttpResponseMessage response, params (string Field, string? ErrorCode, string? MessageContains)[] expectedErrors) =>
        HttpResponseAssertions.AssertValidationErrorAsync(response, expectedErrors);
}
