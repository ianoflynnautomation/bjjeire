// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using BjjEire.Api.IntegrationTests.Common;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using Shouldly;

namespace BjjEire.Api.IntegrationTests;

public abstract class IntegrationTestBase<TFactory> : IClassFixture<TFactory>
    where TFactory : WebApplicationFactory<Program>
{
    protected readonly HttpClient HttpClient;
    protected readonly TFactory _apiFactory;

    protected IntegrationTestBase(TFactory apiFactory)
    {
        _apiFactory = apiFactory;
        HttpClient = apiFactory.CreateClient();
    }

    protected async Task<string> GetAuthTokenAsync(string userId = "dev-user@example.com", string role = "Admin", Dictionary<string, string>? customHeaders = null)
    {
        var queryParams = new Dictionary<string, string>
        {
            { "userId", userId },
            { "role", role }
        };
        var queryString = string.Join("&", queryParams.Select(kvp => $"{kvp.Key}={Uri.EscapeDataString(kvp.Value)}"));

        var baseAddress = HttpClient.BaseAddress?.ToString().TrimEnd('/') ?? throw new InvalidOperationException("HttpClient BaseAddress is not set.");
        var tokenUrl = $"{baseAddress}/generate-token?{queryString}";

        using var request = new HttpRequestMessage(HttpMethod.Get, tokenUrl);
        if (customHeaders != null)
        {
            foreach (var header in customHeaders)
            {
                request.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
        }

        using var response = await HttpClient.SendAsync(request);
        response.StatusCode.ShouldBe(HttpStatusCode.OK, $"Failed to get auth token. Status: {response.StatusCode}, Content: {await response.Content.ReadAsStringAsync()}");

        var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>(TestJsonHelper.SerializerOptions);
        tokenResponse.ShouldNotBeNull("Token response should not be null.");
        tokenResponse.Token.ShouldNotBeNullOrEmpty("Token should not be null or empty.");

        return tokenResponse.Token;
    }

    protected void SetAuthToken(string token)
    {
        HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    protected async Task SetDefaultUserAuthTokenAsync()
    {
        var token = await GetAuthTokenAsync();
        SetAuthToken(token);
    }

    // This DTO is specific to the token generation endpoint used in tests.
    // If it's a shared DTO, it could be moved to a more general location.
    private class TokenResponse
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresUtc { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
