// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net.Http.Json;

using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Api.IntegrationTests.Interfaces;

namespace BjjEire.Api.IntegrationTests.Services;

public class TestHttpClientService(HttpClient client) : ITestHttpClientService
{
    public Task<HttpResponseMessage> DeleteAsync(string requestUri)
        => client.DeleteAsync(requestUri);
    public Task<HttpResponseMessage> GetAsync(string requestUri) => client.GetAsync(requestUri);

    public Task<HttpResponseMessage> PostAsJsonAsync<T>(string requestUri, T value)
        => client.PostAsJsonAsync(requestUri, value, TestJsonHelper.SerializerOptions);

    public async Task<T> ReadAsJsonAsync<T>(HttpResponseMessage response)
    {
        ArgumentNullException.ThrowIfNull(response);

        var result = await response.Content.ReadFromJsonAsync<T>(TestJsonHelper.SerializerOptions).ConfigureAwait(false);
        return result!;
    }
}
