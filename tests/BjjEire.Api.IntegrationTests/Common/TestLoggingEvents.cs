// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace BjjEire.Api.IntegrationTests.Common;

public class TestLoggingEvents
{
    public static class Fixture
    {
        private const int BaseId = 12000;
        public static readonly EventId SetupStarting = new(BaseId + 1, nameof(SetupStarting));
        public static readonly EventId ContainerStarting = new(BaseId + 2, nameof(ContainerStarting));
        public static readonly EventId ContainerStarted = new(BaseId + 3, nameof(ContainerStarted));
        public static readonly EventId TeardownStarting = new(BaseId + 6, nameof(TeardownStarting));
        public static readonly EventId TeardownComplete = new(BaseId + 10, nameof(TeardownComplete));
    }
    public static class TestLifecycle
    {
        private const int BaseId = 13000;
        public static readonly EventId TestStarted = new(BaseId + 1, nameof(TestStarted));
        public static readonly EventId TestFinished = new(BaseId + 2, nameof(TestFinished));

        // Test Outcomes - Use these to explicitly log success or failure.
        public static readonly EventId TestSucceeded = new(BaseId + 3, nameof(TestSucceeded));
        public static readonly EventId TestFailed = new(BaseId + 4, nameof(TestFailed)); // General failure with exception

        // Database and Seeding Events
        public static readonly EventId DatabaseResetting = new(BaseId + 10, nameof(DatabaseResetting));
        public static readonly EventId DatabaseResetComplete = new(BaseId + 11, nameof(DatabaseResetComplete));
        public static readonly EventId SeedingData = new(BaseId + 12, nameof(SeedingData));

        // Assertion and API Interaction Events
        public static readonly EventId AssertionFailed = new(BaseId + 20, nameof(AssertionFailed));
        public static readonly EventId HttpRequestIssued = new(BaseId + 21, nameof(HttpRequestIssued));
        public static readonly EventId HttpResponseReceived = new(BaseId + 22, nameof(HttpResponseReceived));
        public static readonly EventId HttpRequestFailed = new(BaseId + 23, nameof(HttpRequestFailed)); // For HTTP client errors

        // Validation Specific Events
        public static readonly EventId ValidationAssertionStarting = new(BaseId + 30, nameof(ValidationAssertionStarting));
        public static readonly EventId ValidationAssertionPassed = new(BaseId + 31, nameof(ValidationAssertionPassed));
        public static readonly EventId RawJsonResponse = new(BaseId + 32, nameof(RawJsonResponse)); // For debugging

        // Auth Specific Events
        public static readonly EventId AuthTokenRequested = new(BaseId + 40, nameof(AuthTokenRequested));
        public static readonly EventId AuthTokenRetrieved = new(BaseId + 41, nameof(AuthTokenRetrieved));
        public static readonly EventId AuthHeaderSet = new(BaseId + 42, nameof(AuthHeaderSet));

        // Rate Limiting Specific Events
        public static readonly EventId RateLimitHeadersAsserting = new(BaseId + 50, nameof(RateLimitHeadersAsserting));
        public static readonly EventId RateLimitHeadersAsserted = new(BaseId + 51, nameof(RateLimitHeadersAsserted));
        public static readonly EventId RateLimitProblemDetailsAsserting = new(BaseId + 52, nameof(RateLimitProblemDetailsAsserting));
        public static readonly EventId RateLimitProblemDetailsAsserted = new(BaseId + 53, nameof(RateLimitProblemDetailsAsserted));
    }
}
