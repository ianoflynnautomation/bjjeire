// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using System.Text.Json.Nodes;

using Shouldly;

namespace BjjEire.Api.IntegrationTests.OpenApiContractTests.Support;

internal static class JsonResponseReader
{
    public static async Task<JsonNode> ReadJsonNodeAsync(HttpResponseMessage response)
    {
        await using Stream stream = await response.Content.ReadAsStreamAsync();
        JsonNode? body = await JsonNode.ParseAsync(stream, documentOptions: new JsonDocumentOptions { AllowTrailingCommas = false });
        body.ShouldNotBeNull();
        return body;
    }
}
