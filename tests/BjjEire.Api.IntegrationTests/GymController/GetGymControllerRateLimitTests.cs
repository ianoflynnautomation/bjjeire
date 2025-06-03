// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net.Http.Json;
using BjjEire.Api.IntegrationTests.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Shouldly;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.GymController;

public class GetGymControllerRateLimitTests(StrictRateLimitTestApiFactory apiFactory, ITestOutputHelper outputHelper)
    : IntegrationTestBase<StrictRateLimitTestApiFactory>(apiFactory, outputHelper)
{
  private const int TestPermitLimit = 2;
  private const int TestWindowInSeconds = 10;
  private const int TestRejectionStatusCode = StatusCodes.Status429TooManyRequests;

  [Fact(Skip = "specific reason")]
  public async Task WhenRateLimitExceeded_ShouldReturnProblemDetailsAndRateLimitHeaders()
  {

    HttpResponseMessage? lastResponse = null;

    for (var i = 0; i <= TestPermitLimit; i++)
    {
      lastResponse = await HttpClient.GetAsync("api/gym");

      if ((int)lastResponse.StatusCode == TestRejectionStatusCode)
      {
        break;
      }

      await Task.Delay(50);
    }

    // Assert
    lastResponse.ShouldNotBeNull("Response should not be null after making requests.");
    ((int)lastResponse.StatusCode).ShouldBe(TestRejectionStatusCode,
        $"Expected status code {TestRejectionStatusCode} but got {lastResponse.StatusCode}. " +
        $"Content: {await lastResponse.Content.ReadAsStringAsync()}");

    // Assert Rate Limit Headers
    lastResponse.Headers.ShouldContain(h => h.Key == "X-RateLimit-Limit", "X-RateLimit-Limit header is missing.");
    lastResponse.Headers.GetValues("X-RateLimit-Limit").First().ShouldBe(TestPermitLimit.ToString());

    lastResponse.Headers.ShouldContain(h => h.Key == "X-RateLimit-Remaining", "X-RateLimit-Remaining header is missing.");
    lastResponse.Headers.GetValues("X-RateLimit-Remaining").First().ShouldBe("0");

    lastResponse.Headers.ShouldContain(h => h.Key == "X-RateLimit-Reset", "X-RateLimit-Reset header is missing.");
    var resetHeaderValue = lastResponse.Headers.GetValues("X-RateLimit-Reset").First();
    long.TryParse(resetHeaderValue, out var resetTimestamp).ShouldBeTrue("X-RateLimit-Reset should be a long.");

    var currentUnixTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
    // Reset time should be in the near future (current time + roughly RetryAfter seconds)
    resetTimestamp.ShouldBeGreaterThan(currentUnixTime - 5, "X-RateLimit-Reset seems too far in the past."); // Allow for slight clock skew/delay
    resetTimestamp.ShouldBeLessThanOrEqualTo(currentUnixTime + TestWindowInSeconds + 5, "X-RateLimit-Reset seems too far in the future.");


    // Standard Retry-After header (value in seconds)
    // lastResponse.Headers.RetryAfter.ShouldNotBeNull("Retry-After header is missing.");
    // lastResponse.Headers.RetryAfter.Delta.ShouldNotBeNull("RetryAfter.Delta should have a value.");
    // var retryAfterTotalSeconds = (int)lastResponse.Headers.RetryAfter.Delta.Value.TotalSeconds;
    // retryAfterTotalSeconds.ShouldBeGreaterThan(0, "Retry-After seconds should be > 0.");
    // retryAfterTotalSeconds.ShouldBeLessThanOrEqualTo(TestWindowInSeconds, $"Retry-After seconds should be <= window ({TestWindowInSeconds}s).");

    // Assert ProblemDetails response body
    var problemDetails = await lastResponse.Content.ReadFromJsonAsync<ProblemDetails>(TestJsonHelper.SerializerOptions);
    problemDetails.ShouldNotBeNull();
    problemDetails.Status.ShouldBe(TestRejectionStatusCode);
    problemDetails.Title.ShouldBe("API Rate Limit Exceeded");
    problemDetails.Type.ShouldBe("urn:bjjeire:rate-limit-exceeded");
    problemDetails.Detail.ShouldContain("You have reached the maximum number of requests allowed");
    problemDetails.Instance.ShouldNotBeNullOrWhiteSpace();

    // problemDetails.Extensions.ShouldContainKey("retryAfterSeconds");
    // problemDetails.Extensions["retryAfterSeconds"]?.ToString().ShouldBe(retryAfterTotalSeconds.ToString());

    problemDetails.Extensions.ShouldContainKey("limit");
    problemDetails.Extensions["limit"]?.ToString().ShouldBe(TestPermitLimit.ToString());

    problemDetails.Extensions.ShouldContainKey("windowSeconds");
    problemDetails.Extensions["windowSeconds"]?.ToString().ShouldBe(TestWindowInSeconds.ToString());

    // wait for rate limit window to expire. Only needed if additional tests are added to this file
    await Task.Delay(TimeSpan.FromSeconds(TestWindowInSeconds + 1));
  }
}
