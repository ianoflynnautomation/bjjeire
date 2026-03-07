// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;

using BjjEire.Api.IntegrationTests.TestBases;

using Microsoft.AspNetCore.Http;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.GymController;

[Trait("Category", "Sequential")]
[Trait("Category", "Gym")]
public class GetGymControllerRateLimitTests(ITestOutputHelper output)
: RateLimitSequentialIntegrationTestBase(output)
{
    private const int ConfiguredPermitLimit = 2;
    private const int ConfiguredWindowInSeconds = 5;
    private const int ExpectedRejectionStatusCode = StatusCodes.Status429TooManyRequests;

    [Fact]
    public async Task GetGym_WhenRateLimitExceeded_ShouldReturnProblemDetailsAndRateLimitHeadersAsync()
    {
        // Arrange & Act
        HttpResponseMessage? lastResponse = null;
        for (var i = 0; i <= ConfiguredPermitLimit; i++)
        {
            lastResponse = await HttpClient.GetAsync("api/gym");

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

        await Assertions.AssertRateLimitHeadersAsync(lastResponse, ConfiguredPermitLimit, ConfiguredWindowInSeconds);
        await Assertions.AssertRateLimitProblemDetailsAsync(lastResponse, ExpectedRejectionStatusCode, ConfiguredPermitLimit, ConfiguredWindowInSeconds);

    }

    [Fact]
    public async Task GetGym_WhenUnderRateLimit_ShouldSucceedAsync()
    {
        // Arrange
        var requestsToMake = ConfiguredPermitLimit;

        // Act
        var responses = new List<HttpResponseMessage>();
        for (var i = 0; i < requestsToMake; i++)
        {
            responses.Add(await HttpClient.GetAsync("api/gym"));
            await Task.Delay(50);
        }

        // Assert
        responses.ShouldAllBe(r => r.IsSuccessStatusCode);
        responses.Count.ShouldBe(requestsToMake);
    }

    [Fact]
    public async Task GetGym_WhenWindowResets_ShouldAllowRequestsAgainAsync()
    {
        // Arrange
        for (var i = 0; i <= ConfiguredPermitLimit; i++)
        {
            _ = await HttpClient.GetAsync("api/gym");
        }

        var windowDelay = TimeSpan.FromSeconds(ConfiguredWindowInSeconds + 1);
        await Task.Delay(windowDelay);

        // Act
        var responseAfterReset = await HttpClient.GetAsync("api/gym");

        // Assert
        responseAfterReset.StatusCode.ShouldBe(HttpStatusCode.OK);
    }
}
