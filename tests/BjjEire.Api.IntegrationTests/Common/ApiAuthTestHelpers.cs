// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Shouldly;

namespace BjjEire.Api.IntegrationTests.Common;

public static class ApiAuthTestHelpers
{
    public static async Task<string> GetApiTokenAsync(
        HttpClient httpClient,
        ILogger logger,
        string userId = "dev-user@example.com",
        string role = "Admin",
        Dictionary<string, string>? customHeaders = null)
    {
        var queryParams = new Dictionary<string, string> { { "userId", userId }, { "role", role } };
        var queryString = string.Join("&", queryParams.Select(kvp => $"{kvp.Key}={Uri.EscapeDataString(kvp.Value)}"));
        var baseAddress = httpClient.BaseAddress?.ToString().TrimEnd('/') ?? throw new InvalidOperationException("HttpClient BaseAddress is not set.");
        var tokenUrl = new Uri($"{baseAddress}/generate-token?{queryString}");

        logger.LogInformation(TestLoggingEvents.TestLifecycle.AuthTokenRequested,
            "Requesting auth token for UserId {UserId} and Role {Role}", userId, role);

        using var request = new HttpRequestMessage(HttpMethod.Get, tokenUrl);
        if (customHeaders != null)
        {
            foreach (var header in customHeaders)
            {
                request.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
        }

        HttpResponseMessage response;
        string responseContentForError;
        try
        {
            logger.LogDebug(TestLoggingEvents.TestLifecycle.HttpRequestIssued, "Issuing HTTP GET to {TokenUrl}", tokenUrl);
            response = await httpClient.SendAsync(request);
            responseContentForError = await response.Content.ReadAsStringAsync();
            logger.LogDebug(TestLoggingEvents.TestLifecycle.HttpResponseReceived,
                "Received HTTP {StatusCode} response from {TokenUrl}. Response Body: {ResponseBody}",
                (int)response.StatusCode, tokenUrl, responseContentForError);
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(TestLoggingEvents.TestLifecycle.HttpRequestFailed, ex,
                "HTTP request to get auth token failed for URL {TokenUrl}", tokenUrl);
            throw; // Re-throw to fail the test immediately
        }

        try
        {
            // Assert that the HTTP response was successful.
            response.StatusCode.ShouldBe(HttpStatusCode.OK,
                $"Failed to get auth token. Status: {response.StatusCode}, Content: {responseContentForError}");

            // Assert that the response body can be deserialized and contains a valid token.
            var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>(TestJsonHelper.SerializerOptions);
            tokenResponse.ShouldNotBeNull("Token response from API should not be null.");
            tokenResponse.Token.ShouldNotBeNullOrEmpty("Token from API should not be null or empty.");

            logger.LogInformation(TestLoggingEvents.TestLifecycle.AuthTokenRetrieved, "Successfully retrieved and parsed auth token for UserId {UserId}", userId);
            return tokenResponse.Token;
        }
        catch (Exception ex)
        {
            // If any assertion fails, log it with a specific event ID before failing the test.
            logger.LogError(TestLoggingEvents.TestLifecycle.AssertionFailed, ex,
                "Assertion failed while validating the auth token response. Status was {StatusCode}. Body: {ResponseBody}",
                (int)response.StatusCode, responseContentForError);
            throw;
        }
    }

    public static void SetHttpClientAuthToken(HttpClient httpClient, ILogger logger, string token)
    {
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        logger.LogInformation(TestLoggingEvents.TestLifecycle.AuthHeaderSet, "Authorization header set on HttpClient.");
    }

    public static async Task SetDefaultUserAuthTokenOnClientAsync(HttpClient httpClient, ILogger logger)
    {
        var token = await GetApiTokenAsync(httpClient, logger);
        SetHttpClientAuthToken(httpClient, logger, token);
    }

    // A simple record to deserialize the token response
    private sealed record TokenResponse(string Token);
}
