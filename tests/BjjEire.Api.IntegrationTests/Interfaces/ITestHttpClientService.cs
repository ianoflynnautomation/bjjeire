// Copyright (c) {year} BjjWorld. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.IntegrationTests.Interfaces;

public interface ITestHttpClientService
{
    Task<HttpResponseMessage> DeleteAsync(string requestUri);
    Task<HttpResponseMessage> GetAsync(string requestUri);
    Task<T> ReadAsJsonAsync<T>(HttpResponseMessage response);
    Task<HttpResponseMessage> PostAsJsonAsync<T>(string requestUri, T value);
}
