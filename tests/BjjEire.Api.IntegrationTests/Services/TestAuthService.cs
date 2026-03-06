// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Api.IntegrationTests.Interfaces;
using Microsoft.Extensions.Logging;
using Shouldly;

namespace BjjEire.Api.IntegrationTests.Services;

public class TestAuthService(HttpClient httpClient, ILogger<TestAuthService> logger) : ITestAuthService {
    public async Task<string> GetAuthTokenAsync(
        string userId = "dev-user@example.com",
        string role = "Admin",
        Dictionary<string, string>? customHeaders = null) {
        var queryParams = new Dictionary<string, string> { { "userId", userId }, { "role", role } };
        var queryString = string.Join("&", queryParams.Select(kvp => $"{kvp.Key}={Uri.EscapeDataString(kvp.Value)}"));
        var baseAddress = httpClient.BaseAddress?.ToString().TrimEnd('/') ?? throw new InvalidOperationException("HttpClient BaseAddress is not set.");
        var tokenUrl = new Uri($"{baseAddress}/api/developmentutils/generate-token?{queryString}");

        using var request = new HttpRequestMessage(HttpMethod.Get, tokenUrl);
        if (customHeaders != null) {
            foreach (var header in customHeaders) {
                _ = request.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
        }

        HttpResponseMessage response;
        string responseContentForError;
        try {
            response = await httpClient.SendAsync(request);
            responseContentForError = await response.Content.ReadAsStringAsync();
        }
        catch (HttpRequestException ex) {
            logger.LogError(TestLoggingEvents.TestLifecycle.HttpRequestFailed, ex,
                "HTTP request to get auth token failed for URL {TokenUrl}", tokenUrl);
            throw;
        }

        try {
            response.StatusCode.ShouldBe(HttpStatusCode.OK,
                $"Failed to get auth token. Status: {response.StatusCode}, Content: {responseContentForError}");

            var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>(TestJsonHelper.SerializerOptions);
            _ = tokenResponse.ShouldNotBeNull("Token response from API should not be null.");
            tokenResponse.Token.ShouldNotBeNullOrEmpty("Token from API should not be null or empty.");

            return tokenResponse.Token;
        }
        catch (Exception ex) {
            logger.LogError(TestLoggingEvents.TestLifecycle.AssertionFailed, ex,
                "Assertion failed while validating the auth token response. Status was {StatusCode}. Body: {ResponseBody}",
                (int)response.StatusCode, responseContentForError);
            throw;
        }
    }

    public void SetAuthToken(string token) {
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        logger.LogInformation(TestLoggingEvents.TestLifecycle.AuthHeaderSet, "Authorization header set on HttpClient.");
    }

    public async Task SetDefaultUserAuthTokenAsync() {
        var token = await GetAuthTokenAsync();
        SetAuthToken(token);
    }

}
