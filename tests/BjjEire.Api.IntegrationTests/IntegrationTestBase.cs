// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BjjEire.Api.Extensions.Exceptions;
using BjjEire.Api.IntegrationTests.Common;
using Microsoft.AspNetCore.Http;
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

    private class TokenResponse
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresUtc { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

protected async Task AssertValidationErrorAsync(
    HttpResponseMessage response,
    (string Field, string? ErrorCode, string? MessageContains)[] expectedErrors)
{
    // Verify status code
    response.StatusCode.ShouldBe(HttpStatusCode.BadRequest, $"Expected 400 Bad Request, but got {response.StatusCode}");

    // Capture and log raw JSON response
    string rawJsonResponse = await response.Content.ReadAsStringAsync();
    Console.WriteLine($"[DEBUG] Raw JSON Response for Validation Error: {rawJsonResponse}");

    // Deserialize response
    ValidationErrorResponse? errorResponse = null;
    try
    {
        errorResponse = JsonSerializer.Deserialize<ValidationErrorResponse>(
            rawJsonResponse, TestJsonHelper.SerializerOptions);
    }
    catch (JsonException jsonEx)
    {
        Console.WriteLine($"[DEBUG] JSON Deserialization Failed: {jsonEx.Message}");
        Console.WriteLine($"[DEBUG] Path: {jsonEx.Path}, Line: {jsonEx.LineNumber}, BytePos: {jsonEx.BytePositionInLine}");
        throw new InvalidOperationException("Failed to deserialize validation error response.", jsonEx);
    }

    // Validate response structure
    errorResponse.ShouldNotBeNull("Deserialized validation error response was null.");
    errorResponse.Status.ShouldBe(StatusCodes.Status400BadRequest, "Expected status code 400 in response body.");
    errorResponse.Title.ShouldBe("Validation Failed", "Expected title 'Validation Failed'.");
    errorResponse.Type.ShouldBe("urn:bjjeire:validation-error", "Expected type 'urn:bjjeire:validation-error'.");
    errorResponse.Detail.ShouldBe(
        "One or more validation errors occurred. Please see the 'errors' property for details.",
        "Expected detail message mismatch.");
    errorResponse.Errors.ShouldNotBeNull("Errors array should not be null.");
    errorResponse.Errors.ShouldNotBeEmpty($"Expected at least one error, but none were found. Raw response: {rawJsonResponse}");

    // Validate each expected error
    foreach (var expectedError in expectedErrors)
    {
        var fieldError = errorResponse.Errors.FirstOrDefault(e =>
            string.Equals(e.Field, expectedError.Field, StringComparison.OrdinalIgnoreCase));

        fieldError.ShouldNotBeNull(
            $"Expected an error for field '{expectedError.Field}'. " +
            $"Actual errors: [{string.Join(", ", errorResponse.Errors.Select(err => $"'{err.Field}': {err.Message} (Code: {err.ErrorCode})"))}]");

        if (!string.IsNullOrEmpty(expectedError.ErrorCode))
        {
            fieldError.ErrorCode.ShouldBe(
                expectedError.ErrorCode,
                $"Error code for field '{expectedError.Field}' did not match. Expected '{expectedError.ErrorCode}', got '{fieldError.ErrorCode}'.");
        }

        if (!string.IsNullOrEmpty(expectedError.MessageContains))
        {
            fieldError.Message.ShouldContain(
                expectedError.MessageContains,
                Case.Insensitive,
                $"Error message for field '{expectedError.Field}' did not contain expected text '{expectedError.MessageContains}'. Actual: '{fieldError.Message}'.");
        }
    }

    var expectedFields = expectedErrors.Select(e => e.Field.ToLowerInvariant()).ToHashSet();
    var unexpectedErrors = errorResponse.Errors
        .Where(e => !expectedFields.Contains(e.Field.ToLowerInvariant()))
        .ToList();
    unexpectedErrors.ShouldBeEmpty(
        $"Found unexpected errors: [{string.Join(", ", unexpectedErrors.Select(err => $"'{err.Field}': {err.Message} (Code: {err.ErrorCode})"))}]");
}

}
