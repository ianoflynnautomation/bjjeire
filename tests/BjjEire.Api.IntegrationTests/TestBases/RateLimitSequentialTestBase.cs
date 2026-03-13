// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net.Http.Headers;

using BjjEire.Api.IntegrationTests.Fixtures;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.TestBases;

[Collection("Sequential")]
public abstract class RateLimitSequentialIntegrationTestBase : IAsyncLifetime
{
    private IServiceScope _scope = null!;
    private IDisposable? _logContext;
    private RateLimitApiTestFixture _fixture = null!;
    private readonly ITestOutputHelper _output;
    protected ILogger Logger { get; }
    protected HttpClient HttpClient { get; private set; } = null!;
    protected ITestDatabaseService Database { get; private set; } = null!;

    protected RateLimitSequentialIntegrationTestBase(ITestOutputHelper output)
    {
        _output = output;
        Logger = LoggingExtension.ConfigureTestLogger(_output);
    }

    protected void SetBearerToken(string token) =>
        HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    protected void SetDefaultUserToken() => SetBearerToken(TestTokenFactory.Generate());

    protected static async Task<T> ReadJsonAsync<T>(HttpResponseMessage response)
    {
        var result = await response.Content.ReadFromJsonAsync<T>(TestJsonHelper.SerializerOptions).ConfigureAwait(false);
        return result!;
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

        _fixture = new RateLimitApiTestFixture();
        await _fixture.InitializeAsync().ConfigureAwait(false);

        HttpClient = _fixture.Factory.CreateClient();
        _scope = _fixture.Factory.Services.CreateScope();

        Database = _scope.ServiceProvider.GetRequiredService<ITestDatabaseService>();

        Logger.LogInformation("Rate limit isolated fixture and services initialized successfully.");
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

        Logger.LogInformation("Rate limit isolated fixture torn down successfully.");
    }
}
