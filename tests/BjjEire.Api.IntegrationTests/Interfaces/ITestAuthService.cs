// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.IntegrationTests.Interfaces;

public interface ITestAuthService
{
    void SetAuthToken(string token);
    Task SetDefaultUserAuthTokenAsync();
}
