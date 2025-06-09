// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.IntegrationTests.Interfaces;


    public interface ITestAuthService
    {
        Task<string> GetAuthTokenAsync(string userId = "dev-user@example.com", string role = "Admin", Dictionary<string, string>? customHeaders = null);
        void SetAuthToken(string token);
        Task SetDefaultUserAuthTokenAsync();
    }
