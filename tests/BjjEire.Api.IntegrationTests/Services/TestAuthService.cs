// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net.Http.Headers;

using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Api.IntegrationTests.Interfaces;

using Microsoft.Extensions.Logging;

namespace BjjEire.Api.IntegrationTests.Services;

public class TestAuthService(HttpClient httpClient, ILogger<TestAuthService> logger) : ITestAuthService
{
    public void SetAuthToken(string token)
    {
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        logger.LogInformation(TestLoggingEvents.TestLifecycle.AuthHeaderSet, "Authorization header set on HttpClient.");
    }

    public Task SetDefaultUserAuthTokenAsync()
    {
        SetAuthToken(TestTokenFactory.Generate());
        return Task.CompletedTask;
    }
}
