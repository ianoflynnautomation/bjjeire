// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json.Nodes;

using Shouldly;

namespace BjjEire.Api.IntegrationTests.OpenApiContractTests.Support;

internal static class OpenApiSchemaNavigator
{
    public static JsonObject GetComponentSchema(JsonObject document, string schemaName)
    {
        JsonObject schemas = GetRequiredObject(GetRequiredObject(document, "components"), "schemas");
        return GetRequiredObject(schemas, schemaName);
    }

    public static JsonObject GetRequiredObject(JsonObject node, string propertyName)
    {
        node.TryGetPropertyValue(propertyName, out JsonNode? property).ShouldBeTrue();
        property.ShouldNotBeNull();
        return property.AsObject();
    }

    public static JsonObject GetSchemaProperty(JsonObject schema, string propertyName)
    {
        JsonObject properties = GetRequiredObject(schema, "properties");
        return GetRequiredObject(properties, propertyName);
    }

    public static string GetResponseSchemaReference(JsonObject operation, string statusCode)
    {
        JsonObject responses = GetRequiredObject(operation, "responses");
        JsonObject response = GetRequiredObject(responses, statusCode);
        JsonObject content = GetRequiredObject(response, "content");
        JsonObject jsonContent = GetRequiredObject(content, "application/json");
        JsonObject schema = GetRequiredObject(jsonContent, "schema");
        return schema["$ref"]?.GetValue<string>() ?? string.Empty;
    }

    public static JsonObject ResolveEffectiveSchema(JsonObject schema, JsonObject document)
    {
        if (TryResolveReference(schema, document, out JsonObject? resolvedSchema))
        {
            return resolvedSchema!;
        }

        if (schema["oneOf"] is JsonArray oneOf)
        {
            JsonObject? nonNullSchema = oneOf
                .OfType<JsonObject>()
                .FirstOrDefault(candidate => candidate["nullable"]?.GetValue<bool>() != true);

            if (nonNullSchema is not null)
            {
                return ResolveEffectiveSchema(nonNullSchema, document);
            }
        }

        return schema;
    }

    public static bool IsNullable(JsonObject schema, JsonObject document)
    {
        if (schema["nullable"]?.GetValue<bool>() == true)
        {
            return true;
        }

        JsonArray? oneOf = schema["oneOf"] as JsonArray;
        return oneOf?.Any(candidate => candidate is JsonObject candidateSchema && IsNullable(candidateSchema, document)) == true;
    }

    public static bool TryResolveReference(JsonObject schema, JsonObject document, out JsonObject? resolvedSchema)
    {
        resolvedSchema = null;
        string? reference = schema["$ref"]?.GetValue<string>();
        if (reference is null)
        {
            return false;
        }

        string[] segments = reference.TrimStart('#', '/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        JsonNode current = document;
        foreach (string segment in segments)
        {
            current = current.AsObject()[segment]!;
        }

        resolvedSchema = current.AsObject();
        return true;
    }
}
