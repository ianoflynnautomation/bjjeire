// // Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// // Licensed under the MIT License.
//
// using BjjEire.Api.IntegrationTests.TestBases;
// using Microsoft.AspNetCore.Http;
// using Shouldly;
// using Xunit;
// using Xunit.Abstractions;
//
// namespace BjjEire.Api.IntegrationTests.GymController;
//
// [Trait("Category", "Sequential")]
// [Trait("Category", "Gym")]
// public class GetGymControllerRateLimitTests(ITestOutputHelper output) : RateLimitSequentialIntegrationTestBase(output) {
//     private const int ConfiguredPermitLimit = 2;
//     private const int ConfiguredWindowInSeconds = 10;
//     private const int ExpectedRejectionStatusCode = StatusCodes.Status429TooManyRequests;
//
//     [Fact]
//     public async Task GetGym_WhenRateLimitExceeded_ShouldReturnProblemDetailsAndRateLimitHeaders() {
//         HttpResponseMessage? lastResponse = null;
//
//         for (var i = 0; i <= ConfiguredPermitLimit; i++) {
//             lastResponse = await HttpClient.GetAsync("api/gym");
//
//             if ((int)lastResponse.StatusCode == ExpectedRejectionStatusCode) {
//                 break;
//             }
//             await Task.Delay(50);
//         }
//
//         // Assert
//         _ = lastResponse.ShouldNotBeNull("Response should not be null after making requests.");
//         ((int)lastResponse.StatusCode).ShouldBe(ExpectedRejectionStatusCode,
//             $"Expected status code {ExpectedRejectionStatusCode} but got {lastResponse.StatusCode}. " +
//             $"Content: {await lastResponse.Content.ReadAsStringAsync()}");
//
//         await AssertRateLimitHeadersAsync(lastResponse, ConfiguredPermitLimit, ConfiguredWindowInSeconds);
//         await AssertRateLimitProblemDetailsAsync(lastResponse, ExpectedRejectionStatusCode, ConfiguredPermitLimit, ConfiguredWindowInSeconds);
//
//     }
// }
