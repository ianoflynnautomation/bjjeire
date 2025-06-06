// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Reflection;
using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Api.IntegrationTests.Validations;
using Microsoft.Extensions.Logging;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.TestBases;

public abstract class ApiIntegrationTestBase
{
    protected HttpClient HttpClient { get; set; } = null!;
    protected ILogger Logger { get; set; } = null!;
    private IDisposable? _testLogScope;

    /// <summary>
    /// Sets up a logging scope for the duration of a single test.
    /// Must be called by the inheriting class during test initialization.
    /// </summary>
    protected void BeginTestScope(ITestOutputHelper output)
    {
        // Using reflection to get the current test name for detailed logging
        var test = (ITest)output.GetType().GetField("test", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(output)!;
        _testLogScope = Logger.BeginScope("Test: {TestName}", test.DisplayName);
        Logger.LogInformation("Test execution started.");
    }

    /// <summary>
    /// Disposes the logging scope at the end of a test.
    /// Must be called by the inheriting class during test disposal.
    /// </summary>
    protected void EndTestScope()
    {
        Logger.LogInformation("Test execution finished.");
        _testLogScope?.Dispose();
    }

    // --- Authentication Helpers ---
    protected Task<string> GetAuthTokenAsync(string userId = "dev-user@example.com", string role = "Admin", Dictionary<string, string>? customHeaders = null) =>
        ApiAuthTestHelpers.GetApiTokenAsync(HttpClient, Logger, userId, role, customHeaders);

    protected void SetAuthToken(string token) =>
        ApiAuthTestHelpers.SetHttpClientAuthToken(HttpClient, Logger, token);

    protected Task SetDefaultUserAuthTokenAsync() =>
        ApiAuthTestHelpers.SetDefaultUserAuthTokenOnClientAsync(HttpClient, Logger);

    // --- Custom Assertion Helpers ---
    protected Task AssertValidationErrorAsync(HttpResponseMessage response, params (string Field, string? ErrorCode, string? MessageContains)[] expectedErrors) =>
        ApiValidationAssertion.AssertValidationErrorAsync(response, Logger, expectedErrors);

    protected Task AssertRateLimitHeadersAsync(HttpResponseMessage response, int expectedPermitLimit, int expectedWindowInSeconds, string expectedRemaining = "0") =>
        RateLimitAssertion.AssertRateLimitHeadersAsync(Logger, response, expectedPermitLimit, expectedWindowInSeconds, expectedRemaining);

    protected Task AssertRateLimitProblemDetailsAsync(HttpResponseMessage response, int expectedStatusCode, int expectedPermitLimit, int expectedWindowInSeconds) =>
        RateLimitAssertion.AssertRateLimitProblemDetailsAsync(Logger, response, expectedStatusCode, expectedPermitLimit, expectedWindowInSeconds);
}
