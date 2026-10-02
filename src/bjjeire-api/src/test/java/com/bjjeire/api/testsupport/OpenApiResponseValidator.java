package com.bjjeire.api.testsupport;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import tools.jackson.databind.JsonNode;

/**
 * Checks one JSON body against the response schema of the OpenAPI document the same process served. Covers the
 * constructs this API publishes: {@code $ref}, objects, arrays, enums, and nullable types.
 */
public final class OpenApiResponseValidator {
    private static final Pattern ISO_DATE_TIME =
            Pattern.compile("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})");

    private final JsonNode document;

    public OpenApiResponseValidator(JsonNode document) {
        this.document = document;
    }

    public List<String> validateGet(String route, JsonNode body) {
        List<String> errors = new ArrayList<>();
        JsonNode schema = responseSchema(route, errors);
        if (schema != null) {
            validate(schema, body, "$", errors);
        }
        return errors;
    }

    private JsonNode responseSchema(String route, List<String> errors) {
        String pointer = "/paths/" + route.replace("/", "~1") + "/get/responses/200/content";
        JsonNode content = document.at(pointer);
        if (content.isMissingNode()) {
            errors.add("no 200 response for GET " + route);
            return null;
        }
        JsonNode media = content.get("application/json");
        if (media == null) {
            media = content.get("*/*");
        }
        if (media == null || media.path("schema").isMissingNode()) {
            errors.add("no JSON schema for GET " + route);
            return null;
        }
        return resolve(media.path("schema"));
    }

    private JsonNode resolve(JsonNode schema) {
        JsonNode ref = schema.get("$ref");
        if (ref == null || !ref.isTextual()) {
            return schema;
        }
        String pointer = ref.asText();
        if (pointer.startsWith("#")) {
            pointer = pointer.substring(1);
        }
        return resolve(document.at(pointer));
    }

    private void validate(JsonNode schema, JsonNode instance, String path, List<String> errors) {
        schema = resolve(schema);
        JsonNode allOf = schema.get("allOf");
        if (allOf != null && allOf.isArray()) {
            for (JsonNode branch : allOf) {
                validate(branch, instance, path, errors);
            }
            return;
        }
        if (instance == null || instance.isNull()) {
            if (!allows(schema, "null") && !schema.path("nullable").asBoolean(false)) {
                errors.add(path + " is null");
            }
            return;
        }
        rejectUnknownEnum(schema, instance, path, errors);
        if (allows(schema, "array")) {
            validateArray(schema, instance, path, errors);
        } else if (allows(schema, "object") || schema.has("properties")) {
            validateObject(schema, instance, path, errors);
        } else {
            validateScalar(schema, instance, path, errors);
        }
    }

    private static void rejectUnknownEnum(JsonNode schema, JsonNode instance, String path, List<String> errors) {
        JsonNode enumValues = schema.get("enum");
        if (enumValues != null && enumValues.isArray() && !contains(enumValues, instance)) {
            errors.add(path + " is not one of " + enumValues);
        }
    }

    private static void validateScalar(JsonNode schema, JsonNode instance, String path, List<String> errors) {
        if (allows(schema, "integer")) {
            if (!instance.isIntegralNumber()) {
                errors.add(path + " is not an integer");
            }
            return;
        }
        if (allows(schema, "number")) {
            if (!instance.isNumber()) {
                errors.add(path + " is not a number");
            }
            return;
        }
        if (allows(schema, "boolean")) {
            if (!instance.isBoolean()) {
                errors.add(path + " is not a boolean");
            }
            return;
        }
        if (allows(schema, "string")) {
            validateString(schema, instance, path, errors);
        }
    }

    private static void validateString(JsonNode schema, JsonNode instance, String path, List<String> errors) {
        if (!instance.isTextual()) {
            errors.add(path + " is not a string");
            return;
        }
        if ("date-time".equals(schema.path("format").asText())
                && !ISO_DATE_TIME.matcher(instance.asText()).matches()) {
            errors.add(path + " is not a date-time");
        }
    }

    private void validateObject(JsonNode schema, JsonNode instance, String path, List<String> errors) {
        if (!instance.isObject()) {
            errors.add(path + " is not an object");
            return;
        }
        JsonNode required = schema.get("required");
        if (required != null) {
            for (JsonNode name : required) {
                if (!instance.has(name.asText())) {
                    errors.add(path + "." + name.asText() + " is required");
                }
            }
        }
        JsonNode properties = schema.get("properties");
        if (properties == null) {
            return;
        }
        instance.propertyNames().forEach(field -> {
            JsonNode propertySchema = properties.get(field);
            if (propertySchema != null) {
                validate(propertySchema, instance.get(field), path + "." + field, errors);
            }
        });
    }

    private void validateArray(JsonNode schema, JsonNode instance, String path, List<String> errors) {
        if (!instance.isArray()) {
            errors.add(path + " is not an array");
            return;
        }
        JsonNode items = schema.get("items");
        if (items == null) {
            return;
        }
        for (int index = 0; index < instance.size(); index++) {
            validate(items, instance.get(index), path + "[" + index + "]", errors);
        }
    }

    private static boolean allows(JsonNode schema, String typeName) {
        JsonNode type = schema.get("type");
        if (type == null) {
            return false;
        }
        if (type.isTextual()) {
            return typeName.equals(type.asText());
        }
        if (type.isArray()) {
            for (JsonNode candidate : type) {
                if (typeName.equals(candidate.asText())) {
                    return true;
                }
            }
        }
        return false;
    }

    private static boolean contains(JsonNode values, JsonNode instance) {
        for (JsonNode value : values) {
            if (value.equals(instance)) {
                return true;
            }
        }
        return false;
    }
}
