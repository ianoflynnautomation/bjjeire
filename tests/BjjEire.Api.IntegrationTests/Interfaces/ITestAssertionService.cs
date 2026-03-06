// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.IntegrationTests.Interfaces;

public interface ITestAssertionService {
    Task AssertValidationErrorAsync(HttpResponseMessage response, params (string Field, string? ErrorCode, string? MessageContains)[] expectedErrors);
    Task AssertRateLimitHeadersAsync(HttpResponseMessage response, int expectedPermitLimit, int expectedWindowInSeconds, string expectedRemaining = "0");
    Task AssertRateLimitProblemDetailsAsync(HttpResponseMessage response, int expectedStatusCode, int expectedPermitLimit, int expectedWindowInSeconds);
}
