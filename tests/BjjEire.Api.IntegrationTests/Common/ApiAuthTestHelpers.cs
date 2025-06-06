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
        var tokenUrl = $"{baseAddress}/generate-token?{queryString}";

        logger.LogInformation("Requesting auth token for UserId {UserId}", userId);


        using var request = new HttpRequestMessage(HttpMethod.Get, tokenUrl);
        if (customHeaders != null)
        {
            foreach (var header in customHeaders)
            {
                request.Headers.TryAddWithoutValidation(header.Key, header.Value);
                logger.LogDebug("Added custom header for token request: {HeaderKey}", header.Key);
            }
        }

        using var response = await httpClient.SendAsync(request);
        var responseContentForError = await response.Content.ReadAsStringAsync();
        logger.LogDebug("Get token response status: {StatusCode}", response.StatusCode);

        response.StatusCode.ShouldBe(HttpStatusCode.OK, $"Failed to get auth token. Status: {response.StatusCode}, Content: {responseContentForError}");

        var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>(TestJsonHelper.SerializerOptions);
        tokenResponse.ShouldNotBeNull("Token response from API should not be null.");
        tokenResponse.Token.ShouldNotBeNullOrEmpty("Token from API should not be null or empty.");


        logger.LogInformation("Successfully retrieved auth token.");
        return tokenResponse.Token;
    }

    public static void SetHttpClientAuthToken(HttpClient httpClient, ILogger logger, string token)
    {
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        logger.LogInformation("Authorization header set on HttpClient.");
    }

    public static async Task SetDefaultUserAuthTokenOnClientAsync(HttpClient httpClient, ILogger logger)
    {
        logger.LogInformation("Setting default user auth token...");
        var token = await GetApiTokenAsync(httpClient, logger);
        SetHttpClientAuthToken(httpClient, logger, token);
    }

    // A simple record to deserialize the token response
    private sealed record TokenResponse(string Token);
}
