// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;

using Shouldly;

namespace BjjEire.Api.IntegrationTests.OpenApiContractTests.Support;

internal sealed class OpenApiDocumentClient(HttpClient httpClient)
{
    public async Task<JsonObject> GetDocumentAsync()
    {
        HttpResponseMessage response = await httpClient.GetAsync("/openapi/v1.json");
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        JsonNode document = await JsonResponseReader.ReadJsonNodeAsync(response);
        return document.AsObject();
    }

    public static async Task WriteArtifactIfRequestedAsync(JsonObject document)
    {
        string? artifactPath = Environment.GetEnvironmentVariable("OPENAPI_ARTIFACT_PATH");
        if (string.IsNullOrWhiteSpace(artifactPath))
        {
            return;
        }

        string? directory = Path.GetDirectoryName(artifactPath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            _ = Directory.CreateDirectory(directory);
        }

        await File.WriteAllTextAsync(
            artifactPath,
            document.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
    }
}
