using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BjjEire.Api.Extensions.Exceptions;
using BjjEire.Api.IntegrationTests.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Shouldly;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests;

public abstract class IntegrationTestBase<TFactory> : IClassFixture<TFactory>
    where TFactory : WebApplicationFactory<Program>
{
    protected readonly HttpClient HttpClient;
    protected readonly TFactory _apiFactory;
    protected readonly ITestOutputHelper _testOutputHelper;

    protected IntegrationTestBase(TFactory apiFactory, ITestOutputHelper testOutputHelper)
    {
        _apiFactory = apiFactory;
        _testOutputHelper = testOutputHelper;
        HttpClient = apiFactory.CreateClient();
        _testOutputHelper.WriteLine($"[TEST_SETUP] IntegrationTestBase initialized for {typeof(TFactory).Name}. HttpClient BaseAddress: {HttpClient.BaseAddress}");
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

        _testOutputHelper.WriteLine($"[AUTH_TOKEN] Attempting to get auth token. URL: {tokenUrl}, UserId: {userId}, Role: {role}");

        using var request = new HttpRequestMessage(HttpMethod.Get, tokenUrl);
        if (customHeaders != null)
        {
            foreach (var header in customHeaders)
            {
                request.Headers.TryAddWithoutValidation(header.Key, header.Value);
                _testOutputHelper.WriteLine($"[AUTH_TOKEN] Added custom header: {header.Key}");
            }
        }

        using var response = await HttpClient.SendAsync(request);
        var responseContentForError = await response.Content.ReadAsStringAsync();
        _testOutputHelper.WriteLine($"[AUTH_TOKEN] Get token response status: {response.StatusCode}. Content (first 200 chars): {responseContentForError.Substring(0, Math.Min(responseContentForError.Length, 200))}");

        response.StatusCode.ShouldBe(HttpStatusCode.OK, $"Failed to get auth token. Status: {response.StatusCode}, Content: {responseContentForError}");

        var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>(TestJsonHelper.SerializerOptions);
        _ = tokenResponse.ShouldNotBeNull("Token response should not be null.");
        tokenResponse.Token.ShouldNotBeNullOrEmpty("Token should not be null or empty.");

        _testOutputHelper.WriteLine($"[AUTH_TOKEN] Successfully retrieved auth token for UserId: {userId}. Token (first 10 chars): {tokenResponse.Token.Substring(0, Math.Min(10, tokenResponse.Token.Length))}...");
        return tokenResponse.Token;
    }

    protected void SetAuthToken(string token)
    {
        HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _testOutputHelper.WriteLine($"[AUTH_SETUP] Authorization header set with token (first 10 chars): {token.Substring(0, Math.Min(10, token.Length))}...");
    }

    protected async Task SetDefaultUserAuthTokenAsync()
    {
        _testOutputHelper.WriteLine("[AUTH_SETUP] Attempting to set default user auth token...");
        var token = await GetAuthTokenAsync();
        SetAuthToken(token);
        _testOutputHelper.WriteLine("[AUTH_SETUP] Default user auth token set successfully.");
    }

    protected async Task AssertValidationErrorAsync(
        HttpResponseMessage response,
        (string Field, string? ErrorCode, string? MessageContains)[] expectedErrors)
    {
        _testOutputHelper.WriteLine($"[ASSERT_VALIDATION] Starting validation error assertion. Expected {expectedErrors.Length} errors.");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest, $"Expected 400 Bad Request, but got {response.StatusCode}");

        string rawJsonResponse = await response.Content.ReadAsStringAsync();
        _testOutputHelper.WriteLine($"[ASSERT_VALIDATION] Raw JSON Response for Validation Error: {rawJsonResponse}");

        ValidationErrorResponse? errorResponse = null;
        try
        {
            errorResponse = JsonSerializer.Deserialize<ValidationErrorResponse>(
                rawJsonResponse, TestJsonHelper.SerializerOptions);
        }
        catch (JsonException jsonEx)
        {
            _testOutputHelper.WriteLine($"[ASSERT_VALIDATION] JSON Deserialization Failed: {jsonEx.Message}");
            _testOutputHelper.WriteLine($"[ASSERT_VALIDATION] Path: {jsonEx.Path}, Line: {jsonEx.LineNumber}, BytePos: {jsonEx.BytePositionInLine}");
            throw new InvalidOperationException("Failed to deserialize validation error response.", jsonEx);
        }

        _ = errorResponse.ShouldNotBeNull("Deserialized validation error response was null.");
        errorResponse.Status.ShouldBe(StatusCodes.Status400BadRequest, "Expected status code 400 in response body.");
        errorResponse.Title.ShouldBe("Validation Failed", "Expected title 'Validation Failed'.");
        errorResponse.Type.ShouldBe("urn:bjjeire:validation-error", "Expected type 'urn:bjjeire:validation-error'.");
        errorResponse.Detail.ShouldBe(
            "One or more validation errors occurred. Please see the 'errors' property for details.",
            "Expected detail message mismatch.");
        _ = errorResponse.Errors.ShouldNotBeNull("Errors array should not be null.");
        errorResponse.Errors.ShouldNotBeEmpty($"Expected at least one error, but none were found. Raw response: {rawJsonResponse}");

        foreach (var expectedError in expectedErrors)
        {
            _testOutputHelper.WriteLine($"[ASSERT_VALIDATION] Checking for error on Field: '{expectedError.Field}', ErrorCode: '{expectedError.ErrorCode ?? "N/A"}', MessageContains: '{expectedError.MessageContains ?? "N/A"}'");
            var fieldError = errorResponse.Errors.FirstOrDefault(e =>
                string.Equals(e.Field, expectedError.Field, StringComparison.OrdinalIgnoreCase));

            _ = fieldError.ShouldNotBeNull(
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

        _testOutputHelper.WriteLine($"[ASSERT_VALIDATION] Validation error assertions completed successfully for {expectedErrors.Length} expected errors.");
    }

    private sealed class TokenResponse
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresUtc { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
