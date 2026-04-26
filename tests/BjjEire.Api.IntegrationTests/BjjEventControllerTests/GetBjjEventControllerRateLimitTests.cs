// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Net;

using Microsoft.AspNetCore.Http;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.BjjEventControllerTests;

[Trait("Feature", "BjjEvents")]
[Trait("Category", "Integration")]
[Trait("Category", "RateLimit")]
public class GetBjjEventControllerRateLimitTests(ITestOutputHelper output)
    : RateLimitSequentialIntegrationTestBase(output)
{
    private const int ConfiguredPermitLimit = 2;
    private const int ConfiguredWindowInSeconds = 5;
    private const int ExpectedRejectionStatusCode = StatusCodes.Status429TooManyRequests;

    [Fact]
    public async Task GetBjjEvent_WhenRateLimitExceeded_ShouldReturnProblemDetailsAndRateLimitHeadersAsync()
    {
        // Arrange & Act
        HttpResponseMessage? lastResponse = null;
        for (int i = 0; i <= ConfiguredPermitLimit; i++)
        {
            lastResponse = await HttpClient.GetAsync("api/v1/bjjevent");

            if ((int)lastResponse.StatusCode == ExpectedRejectionStatusCode)
            {
                break;
            }
            await Task.Delay(50);
        }

        // Assert
        _ = lastResponse.ShouldNotBeNull("Response should not be null after making requests.");
        ((int)lastResponse.StatusCode).ShouldBe(ExpectedRejectionStatusCode,
            $"Expected status code {ExpectedRejectionStatusCode} but got {lastResponse.StatusCode}. " +
            $"Content: {await lastResponse.Content.ReadAsStringAsync()}");

        await HttpResponseAssertions.AssertRateLimitHeadersAsync(lastResponse, ConfiguredPermitLimit, ConfiguredWindowInSeconds);
        await HttpResponseAssertions.AssertRateLimitProblemDetailsAsync(lastResponse, ExpectedRejectionStatusCode, ConfiguredPermitLimit, ConfiguredWindowInSeconds);
    }

    [Fact]
    public async Task GetBjjEvent_WhenUnderRateLimit_ShouldSucceedAsync()
    {
        // Arrange
        int requestsToMake = ConfiguredPermitLimit;

        // Act
        List<HttpResponseMessage> responses = [];
        for (int i = 0; i < requestsToMake; i++)
        {
            responses.Add(await HttpClient.GetAsync("api/v1/bjjevent"));
            await Task.Delay(50);
        }

        // Assert
        responses.ShouldAllBe(r => r.IsSuccessStatusCode);
        responses.Count.ShouldBe(requestsToMake);
    }

    [Fact]
    public async Task GetBjjEvent_WhenWindowResets_ShouldAllowRequestsAgainAsync()
    {
        // Arrange
        for (int i = 0; i <= ConfiguredPermitLimit; i++)
        {
            _ = await HttpClient.GetAsync("api/v1/bjjevent");
        }

        // Wait for the sliding window to expire
        await Task.Delay(TimeSpan.FromSeconds(ConfiguredWindowInSeconds + 1));

        // Act
        HttpResponseMessage responseAfterReset = await HttpClient.GetAsync("api/v1/bjjevent");

        // Assert
        responseAfterReset.StatusCode.ShouldBe(HttpStatusCode.OK);
    }
}
