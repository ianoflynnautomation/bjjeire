// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Net.Http.Headers;

using BjjEire.Api.IntegrationTests.Fixtures;

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
[Collection(IsolatedFixtureCollection.Name)]
public abstract class IsolationTestBase : IAsyncLifetime
{
    private IServiceScope _scope = null!;
    private IDisposable? _logContext;
    private ApiTestFixture _fixture = null!;
    private readonly ITestOutputHelper _output;
    protected ILogger Logger { get; }
    protected HttpClient HttpClient { get; private set; } = null!;
    protected ITestDatabaseService Database { get; private set; } = null!;

    protected IsolationTestBase(ITestOutputHelper output)
    {
        _output = output;
        Logger = LoggingExtension.ConfigureTestLogger(_output);
    }

    protected void SetBearerToken(string token) =>
        HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    protected void SetDefaultUserToken() => SetBearerToken(TestTokenFactory.Generate());

    protected static async Task<T> ReadJsonAsync<T>(HttpResponseMessage response)
    {
        T? result = await response.Content.ReadFromJsonAsync<T>(TestJsonHelper.SerializerOptions).ConfigureAwait(false);
        return result!;
    }

    public async Task InitializeAsync()
    {
        ITest test = (ITest)_output.GetType().GetField("test", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic)!.GetValue(_output)!;
        string testName = test.DisplayName;
        Guid correlationId = Guid.NewGuid();

        _logContext = Serilog.Context.LogContext.Push(
            new Serilog.Core.Enrichers.PropertyEnricher("TestName", testName),
            new Serilog.Core.Enrichers.PropertyEnricher("CorrelationId", correlationId)
        );

        Logger.LogInformation("Test execution started: {TestName}", testName);

        _fixture = new ApiTestFixture();
        await _fixture.InitializeAsync().ConfigureAwait(false);

        HttpClient = _fixture.Factory.CreateClient();
        _scope = _fixture.Factory.Services.CreateScope();
        IServiceProvider serviceProvider = _scope.ServiceProvider;

        Database = serviceProvider.GetRequiredService<ITestDatabaseService>();

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
            await _fixture.DisposeAsync().ConfigureAwait(false);
        }

        Logger.LogInformation("Isolated fixture torn down successfully.");
    }
}
