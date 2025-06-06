// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net.Http.Json;
using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Application.Features.Gyms.Queries;
using Shouldly;

namespace BjjEire.Api.IntegrationTests.Services;

public class TestHttpClientService(HttpClient client) : ITestHttpClientService
{
    public Task<HttpResponseMessage> GetAsync(string requestUri) => client.GetAsync(requestUri);

    public Task<HttpResponseMessage> PostAsJsonAsync<T>(string requestUri, T value)
        => client.PostAsJsonAsync(requestUri, value, TestJsonHelper.SerializerOptions);

    public async Task<T> ReadAsJsonAsync<T>(HttpResponseMessage response)
    {
        var result = await response.Content.ReadFromJsonAsync<T>(TestJsonHelper.SerializerOptions);
        return result!;
    }
}
