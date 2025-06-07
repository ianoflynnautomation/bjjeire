using System.Net.Http.Json;
using System.Text.Json;
using BjjEire.Api.IntegrationTests.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Shouldly;

namespace BjjEire.Api.IntegrationTests.Validations;

public static class RateLimitAssertion
{
    public static async Task AssertRateLimitHeadersAsync(
        ILogger logger,
        HttpResponseMessage response,
        int expectedPermitLimit,
        int expectedWindowInSeconds,
        string expectedRemaining = "0")
    {
        logger.LogInformation(TestLoggingEvents.TestLifecycle.RateLimitHeadersAsserting,
            "Asserting rate limit headers. Expected PermitLimit: {PermitLimit}, Window: {WindowInSeconds}, Remaining: {Remaining}",
            expectedPermitLimit, expectedWindowInSeconds, expectedRemaining);

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
    }

    public static async Task AssertRateLimitProblemDetailsAsync(
        ILogger logger,
        HttpResponseMessage response,
        int expectedStatusCode,
        int expectedPermitLimit,
        int expectedWindowInSeconds)
    {
        logger.LogInformation(TestLoggingEvents.TestLifecycle.RateLimitProblemDetailsAsserting,
            "Asserting rate limit problem details. Expected Status: {StatusCode}, PermitLimit: {PermitLimit}, Window: {WindowInSeconds}",
            expectedStatusCode, expectedPermitLimit, expectedWindowInSeconds);

        var problemDetails = await response.Content.ReadFromJsonAsync<ProblemDetails>(TestJsonHelper.SerializerOptions);
        problemDetails.ShouldNotBeNull("ProblemDetails response body should not be null.");
        problemDetails.Status.ShouldBe(expectedStatusCode, $"ProblemDetails status should be {expectedStatusCode}.");
        problemDetails.Title.ShouldBe("API Rate Limit Exceeded", "ProblemDetails title mismatch.");
        problemDetails.Type.ShouldBe("urn:bjjeire:rate-limit-exceeded", "ProblemDetails type mismatch.");
        problemDetails.Detail.ShouldBe("You have reached the maximum number of requests allowed. Please try again after the specified period.");
        problemDetails.Instance.ShouldNotBeNullOrWhiteSpace("ProblemDetails instance should be populated.");

        problemDetails.Extensions.ShouldContainKey("limit");
        var limitValue = problemDetails.Extensions["limit"].ShouldNotBeNull("Extension 'limit' should not be null.");
        ((JsonElement)limitValue).Deserialize<int>(TestJsonHelper.SerializerOptions).ShouldBe(expectedPermitLimit);

        problemDetails.Extensions.ShouldContainKey("windowSeconds");
        var windowSecondsValue = problemDetails.Extensions["windowSeconds"].ShouldNotBeNull("Extension 'windowSeconds' should not be null.");
        ((JsonElement)windowSecondsValue).Deserialize<int>(TestJsonHelper.SerializerOptions).ShouldBe(expectedWindowInSeconds);

        logger.LogInformation(TestLoggingEvents.TestLifecycle.RateLimitProblemDetailsAsserted,
            "Rate limit problem details asserted successfully");
    }
}
