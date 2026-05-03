// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using System.Text.Json.Nodes;

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Api.IntegrationTests.OpenApiContractTests.Support;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.OpenApiContractTests;

[Collection(GymApiCollection.Name)]
[Trait("Feature", "OpenApi")]
[Trait("Category", "Integration")]
public sealed class OpenApiContractTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ApiIntegrationTestBase(fixture, output)
{
    [Fact]
    public async Task OpenApiDocument_ShouldBeAvailableInTestHostAndDescribePublicApiContractsAsync()
    {
        JsonObject document = await new OpenApiDocumentClient(HttpClient).GetDocumentAsync();
        await OpenApiDocumentClient.WriteArtifactIfRequestedAsync(document);

        document["openapi"]?.GetValue<string>().ShouldStartWith("3.0");
        JsonObject paths = OpenApiSchemaNavigator.GetRequiredObject(document, "paths");
        JsonObject components = OpenApiSchemaNavigator.GetRequiredObject(document, "components");
        JsonObject schemas = OpenApiSchemaNavigator.GetRequiredObject(components, "schemas");

        paths.ContainsKey(ApiRoutes.Gyms).ShouldBeTrue();
        paths.ContainsKey(ApiRoutes.BjjEvents).ShouldBeTrue();
        paths.ContainsKey(ApiRoutes.Competitions).ShouldBeTrue();
        paths.ContainsKey(ApiRoutes.Stores).ShouldBeTrue();

        schemas.ContainsKey("ProblemDetails").ShouldBeTrue();
        schemas.ContainsKey("ValidationProblemDetails").ShouldBeTrue();
        schemas.ContainsKey("PagedResponseOfGymDto").ShouldBeTrue();
        schemas.ContainsKey("PagedResponseOfBjjEventDto").ShouldBeTrue();
        schemas.ContainsKey("PagedResponseOfCompetitionDto").ShouldBeTrue();
        schemas.ContainsKey("PagedResponseOfStoreDto").ShouldBeTrue();
    }

    [Theory]
    [MemberData(nameof(OpenApiContractCases.PublishedDtoFields), MemberType = typeof(OpenApiContractCases))]
    public async Task PublishedDtoFields_ShouldKeepExpectedTypeAndNullabilityAsync(
        string schemaName,
        string propertyName,
        string expectedType,
        bool expectedNullable)
    {
        JsonObject document = await new OpenApiDocumentClient(HttpClient).GetDocumentAsync();
        JsonObject schema = OpenApiSchemaNavigator.GetComponentSchema(document, schemaName);
        JsonObject propertySchema = OpenApiSchemaNavigator.GetSchemaProperty(schema, propertyName);
        JsonObject resolvedSchema = OpenApiSchemaNavigator.ResolveEffectiveSchema(propertySchema, document);

        resolvedSchema["type"]?.GetValue<string>().ShouldBe(expectedType);
        OpenApiSchemaNavigator.IsNullable(propertySchema, document).ShouldBe(expectedNullable);
    }

    [Theory]
    [MemberData(nameof(OpenApiContractCases.PagedResponseEndpoints), MemberType = typeof(OpenApiContractCases))]
    public async Task GetListEndpoints_ShouldReturnPayloadsMatchingDocumentedPagedResponseSchemaAsync(
        string path,
        string responseSchemaName)
    {
        await OpenApiContractSeedData.SeedAllAsync(Database);
        JsonObject document = await new OpenApiDocumentClient(HttpClient).GetDocumentAsync();
        JsonObject schema = OpenApiSchemaNavigator.GetComponentSchema(document, responseSchemaName);

        HttpResponseMessage response = await HttpClient.GetAsync($"{path}?page=1&pageSize=5");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.ShouldBe("application/json");
        JsonNode body = await JsonResponseReader.ReadJsonNodeAsync(response);
        OpenApiResponseSchemaAsserter.AssertJsonMatchesOpenApiSchema(body, schema, document);
    }

    [Fact]
    public async Task ErrorResponses_ShouldUseProblemDetailsSchemasInOpenApiAsync()
    {
        JsonObject document = await new OpenApiDocumentClient(HttpClient).GetDocumentAsync();
        JsonObject problemDetailsSchema = OpenApiSchemaNavigator.GetComponentSchema(document, "ProblemDetails");
        JsonObject validationProblemDetailsSchema = OpenApiSchemaNavigator.GetComponentSchema(document, "ValidationProblemDetails");
        JsonObject paths = OpenApiSchemaNavigator.GetRequiredObject(document, "paths");
        JsonObject gymGet = OpenApiSchemaNavigator.GetRequiredObject(OpenApiSchemaNavigator.GetRequiredObject(paths, ApiRoutes.Gyms), "get");
        JsonObject gymPost = OpenApiSchemaNavigator.GetRequiredObject(OpenApiSchemaNavigator.GetRequiredObject(paths, ApiRoutes.Gyms), "post");

        OpenApiSchemaNavigator.GetResponseSchemaReference(gymGet, "400").ShouldBe("#/components/schemas/ValidationProblemDetails");
        OpenApiSchemaNavigator.GetResponseSchemaReference(gymGet, "500").ShouldBe("#/components/schemas/ProblemDetails");
        OpenApiSchemaNavigator.GetResponseSchemaReference(gymPost, "400").ShouldBe("#/components/schemas/ValidationProblemDetails");
        OpenApiSchemaNavigator.GetResponseSchemaReference(gymPost, "401").ShouldBe("#/components/schemas/ProblemDetails");
        OpenApiSchemaNavigator.GetResponseSchemaReference(gymPost, "403").ShouldBe("#/components/schemas/ProblemDetails");

        problemDetailsSchema.ContainsKey("properties").ShouldBeTrue();
        validationProblemDetailsSchema.ContainsKey("properties").ShouldBeTrue();
        OpenApiSchemaNavigator.GetRequiredObject(OpenApiSchemaNavigator.GetRequiredObject(validationProblemDetailsSchema, "properties"), "errors");
    }
}
