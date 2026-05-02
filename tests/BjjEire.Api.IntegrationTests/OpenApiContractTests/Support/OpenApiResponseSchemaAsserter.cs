// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using System.Text.Json.Nodes;

using Shouldly;

namespace BjjEire.Api.IntegrationTests.OpenApiContractTests.Support;

internal static class OpenApiResponseSchemaAsserter
{
    public static void AssertJsonMatchesOpenApiSchema(JsonNode value, JsonObject schema, JsonObject document, string path = "$")
    {
        if (OpenApiSchemaNavigator.TryResolveReference(schema, document, out JsonObject? resolvedSchema))
        {
            AssertJsonMatchesOpenApiSchema(value, resolvedSchema!, document, path);
            return;
        }

        if (IsNullable(schema) && value.GetValueKind() == JsonValueKind.Null)
        {
            return;
        }

        string? type = schema["type"]?.GetValue<string>();
        if (type is null && schema["properties"] is JsonObject)
        {
            type = "object";
        }

        switch (type)
        {
            case "object":
                AssertObjectMatchesOpenApiSchema(value, schema, document, path);
                break;
            case "array":
                value.GetValueKind().ShouldBe(JsonValueKind.Array, $"{path} should be an array.");
                JsonObject itemSchema = OpenApiSchemaNavigator.GetRequiredObject(schema, "items");
                int index = 0;
                foreach (JsonNode? item in value.AsArray())
                {
                    item.ShouldNotBeNull();
                    AssertJsonMatchesOpenApiSchema(item, itemSchema, document, $"{path}[{index}]");
                    index++;
                }
                break;
            case "string":
                value.GetValueKind().ShouldBe(JsonValueKind.String, $"{path} should be a string.");
                AssertEnumValueIfDocumented(value, schema, path);
                break;
            case "integer":
                value.GetValueKind().ShouldBe(JsonValueKind.Number, $"{path} should be an integer.");
                value.AsValue().TryGetValue(out int _).ShouldBeTrue($"{path} should be an integer.");
                AssertEnumValueIfDocumented(value, schema, path);
                break;
            case "number":
                value.GetValueKind().ShouldBe(JsonValueKind.Number, $"{path} should be a number.");
                break;
            case "boolean":
                (value.GetValueKind() is JsonValueKind.True or JsonValueKind.False).ShouldBeTrue($"{path} should be a boolean.");
                break;
        }
    }

    private static void AssertObjectMatchesOpenApiSchema(JsonNode value, JsonObject schema, JsonObject document, string path)
    {
        value.GetValueKind().ShouldBe(JsonValueKind.Object, $"{path} should be an object.");
        JsonObject actual = value.AsObject();
        JsonObject? properties = schema["properties"] as JsonObject;
        if (properties is null)
        {
            return;
        }

        HashSet<string> requiredProperties = (schema["required"] as JsonArray)?
            .Select(item => item?.GetValue<string>())
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name!)
            .ToHashSet(StringComparer.Ordinal)
            ?? [];

        foreach (string requiredProperty in requiredProperties)
        {
            actual.ContainsKey(requiredProperty).ShouldBeTrue($"{path}.{requiredProperty} is required by OpenAPI.");
        }

        foreach (KeyValuePair<string, JsonNode?> property in properties)
        {
            if (!actual.TryGetPropertyValue(property.Key, out JsonNode? actualProperty) || actualProperty is null || property.Value is null)
            {
                continue;
            }

            AssertJsonMatchesOpenApiSchema(actualProperty, property.Value.AsObject(), document, $"{path}.{property.Key}");
        }
    }

    private static bool IsNullable(JsonObject schema) =>
        schema["nullable"]?.GetValue<bool>() == true;

    private static void AssertEnumValueIfDocumented(JsonNode value, JsonObject schema, string path)
    {
        if (schema["enum"] is not JsonArray enumValues)
        {
            return;
        }

        string actual = value.ToJsonString();
        enumValues.Select(item => item?.ToJsonString()).ShouldContain(actual, $"{path} should match the documented enum.");
    }
}
