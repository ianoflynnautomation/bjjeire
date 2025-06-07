// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.IntegrationTests.Services;

public interface ITestHttpClientService
{
    Task<HttpResponseMessage> GetAsync(string requestUri);
    Task<T> ReadAsJsonAsync<T>(HttpResponseMessage response);
    Task<HttpResponseMessage> PostAsJsonAsync<T>(string requestUri, T value);
}
