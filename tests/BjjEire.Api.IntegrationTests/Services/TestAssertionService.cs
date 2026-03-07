// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using BjjEire.Api.Extensions.Exceptions;
using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Api.IntegrationTests.Interfaces;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using Shouldly;

namespace BjjEire.Api.IntegrationTests.Services;

public class TestAssertionService(ILogger<TestAssertionService> logger) : ITestAssertionService
{
    public async Task AssertValidationErrorAsync(
        HttpResponseMessage response,
        params (string Field, string? ErrorCode, string? MessageContains)[] expectedErrors)
    {
        ArgumentNullException.ThrowIfNull(response);
        ArgumentNullException.ThrowIfNull(logger);

        var responseContentForError = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest, $"Response: {responseContentForError}");

        var errorResponse = JsonSerializer.Deserialize<ValidationErrorResponse>(responseContentForError, TestJsonHelper.SerializerOptions);

        _ = errorResponse.ShouldNotBeNull();
        errorResponse.Status.ShouldBe(StatusCodes.Status400BadRequest);
        errorResponse.Title.ShouldBe("Validation Failed");
        _ = errorResponse.Errors.ShouldNotBeNull();

        string actualErrorsForDisplay()
        {
            return $"Actual errors: [{string.Join("; ", errorResponse.Errors.Select(err => $"Field: '{err.Field}', Code: '{err.ErrorCode}', Msg: '{err.Message}'"))}]";
        }

        errorResponse.Errors.Count.ShouldBe(expectedErrors.Length,
            $"Expected {expectedErrors.Length} validation errors, but found {errorResponse.Errors.Count}. {actualErrorsForDisplay()}");

        foreach (var (field, errorCode, messageContains) in expectedErrors)
        {
            var foundMatch = errorResponse.Errors.Any(actualError =>
                string.Equals(actualError.Field, field, StringComparison.OrdinalIgnoreCase) &&
                (string.IsNullOrEmpty(errorCode) || string.Equals(actualError.ErrorCode, errorCode, StringComparison.OrdinalIgnoreCase)) &&
                (string.IsNullOrEmpty(messageContains) || (actualError.Message?.Contains(messageContains, StringComparison.OrdinalIgnoreCase) ?? false))
            );

            foundMatch.ShouldBeTrue(
                $"Did not find expected validation error for Field: '{field}', ErrorCode: '{errorCode ?? "N/A"}'. {actualErrorsForDisplay()}");
        }
    }


    public Task AssertRateLimitHeadersAsync(
    HttpResponseMessage response,
    int expectedPermitLimit,
    int expectedWindowInSeconds,
    string expectedRemaining = "0")
    {
        ArgumentNullException.ThrowIfNull(response);

        response.Headers.ShouldContain(h => h.Key == "X-RateLimit-Limit", "X-RateLimit-Limit header is missing.");
        response.Headers.GetValues("X-RateLimit-Limit").First().ShouldBe(expectedPermitLimit.ToString());
        response.Headers.ShouldContain(h => h.Key == "X-RateLimit-Remaining", "X-RateLimit-Remaining header is missing.");
        response.Headers.GetValues("X-RateLimit-Remaining").First().ShouldBe(expectedRemaining);
        response.Headers.ShouldContain(h => h.Key == "X-RateLimit-Reset", "X-RateLimit-Reset header is missing.");
        var resetHeaderValue = response.Headers.GetValues("X-RateLimit-Reset").First();
        long.TryParse(resetHeaderValue, out var resetTimestamp).ShouldBeTrue("X-RateLimit-Reset should be a parseable long (Unix epoch seconds).");

        var currentUnixTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        resetTimestamp.ShouldBeGreaterThan(currentUnixTime - 10, "X-RateLimit-Reset timestamp seems too far in the past.");
        resetTimestamp.ShouldBeLessThanOrEqualTo(currentUnixTime + expectedWindowInSeconds + 10, "X-RateLimit-Reset timestamp seems too far in the future.");
        return Task.CompletedTask;
    }

    public async Task AssertRateLimitProblemDetailsAsync(
        HttpResponseMessage response,
        int expectedStatusCode,
        int expectedPermitLimit,
        int expectedWindowInSeconds)
    {
        ArgumentNullException.ThrowIfNull(response);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>(TestJsonHelper.SerializerOptions).ConfigureAwait(false);

        _ = problemDetails.ShouldNotBeNull();
        problemDetails.Status.ShouldBe(expectedStatusCode, $"ProblemDetails status should be {expectedStatusCode}.");
        problemDetails.Title.ShouldBe("API Rate Limit Exceeded");
        problemDetails.Type.ShouldBe("urn:bjjeire:rate-limit-exceeded");
        problemDetails.Detail.ShouldBe("You have reached the maximum number of requests allowed. Please try again after the specified period.");
        problemDetails.Instance.ShouldNotBeNullOrWhiteSpace();

        problemDetails.Extensions.ShouldContainKey("limit");
        var limitValue = problemDetails.Extensions["limit"].ShouldNotBeNull("Extension 'limit' should not be null.");
        ((JsonElement)limitValue).Deserialize<int>(TestJsonHelper.SerializerOptions).ShouldBe(expectedPermitLimit);

        problemDetails.Extensions.ShouldContainKey("windowSeconds");
        var windowSecondsValue = problemDetails.Extensions["windowSeconds"].ShouldNotBeNull("Extension 'windowSeconds' should not be null.");
        ((JsonElement)windowSecondsValue).Deserialize<int>(TestJsonHelper.SerializerOptions).ShouldBe(expectedWindowInSeconds);
    }

}
