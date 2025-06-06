// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using System.Text.Json;
using BjjEire.Api.Extensions.Exceptions;
using BjjEire.Api.IntegrationTests.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Shouldly;

namespace BjjEire.Api.IntegrationTests.Validations;

public static class ApiValidationAssertion
{
    public static async Task AssertValidationErrorAsync(
        HttpResponseMessage response,
        ILogger logger,
        params (string Field, string? ErrorCode, string? MessageContains)[] expectedErrors)
    {
        ArgumentNullException.ThrowIfNull(response);
        ArgumentNullException.ThrowIfNull(logger);

        logger.LogInformation("Asserting validation error. Expecting {ErrorCount} criteria.", expectedErrors.Length);

        var responseContentForError = await response.Content.ReadAsStringAsync();
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest, $"Expected 400 Bad Request, but got {response.StatusCode}. Response: {responseContentForError}");
        logger.LogDebug("Raw JSON response for validation error: {JsonResponse}", responseContentForError);

        ValidationErrorResponse? errorResponse;
        try
        {
            errorResponse = JsonSerializer.Deserialize<ValidationErrorResponse>(responseContentForError, TestJsonHelper.SerializerOptions);
        }
        catch (JsonException jsonEx)
        {
            logger.LogError(jsonEx, "JSON Deserialization Failed.");
            throw new InvalidOperationException($"Failed to deserialize validation error response. Raw JSON: {responseContentForError}", jsonEx);
        }

        errorResponse.ShouldNotBeNull("Deserialized validation error response was null.");
        errorResponse.Status.ShouldBe(StatusCodes.Status400BadRequest, "Expected status code 400 in response body.");
        errorResponse.Title.ShouldBe("Validation Failed", "Expected title 'Validation Failed'.");
        errorResponse.Type.ShouldBe("urn:bjjeire:validation-error", "Expected type 'urn:bjjeire:validation-error'.");
        errorResponse.Detail.ShouldBe("One or more validation errors occurred. Please see the 'errors' property for details.", "Expected detail message mismatch.");
        errorResponse.Errors.ShouldNotBeNull("Errors collection should not be null.");

        var actualErrorsForDisplay = () => $"Actual errors: [{string.Join("; ", errorResponse.Errors.Select(err => $"Field: '{err.Field}', Code: '{err.ErrorCode}', Msg: '{err.Message}'"))}]";

        errorResponse.Errors.Count.ShouldBe(expectedErrors.Length,
            $"Expected exactly {expectedErrors.Length} validation errors, but found {errorResponse.Errors.Count}. {actualErrorsForDisplay()}");

        foreach (var (field, errorCode, messageContains) in expectedErrors)
        {
            logger.LogInformation(
                "Verifying expected error for Field: '{Field}', ErrorCode: '{ErrorCode}', MessageContains: '{MessageContains}'",
                field, errorCode ?? "N/A", messageContains ?? "N/A");

            var foundMatch = errorResponse.Errors.Any(actualError =>
                string.Equals(actualError.Field, field, StringComparison.OrdinalIgnoreCase) &&
                (string.IsNullOrEmpty(errorCode) || string.Equals(actualError.ErrorCode, errorCode, StringComparison.OrdinalIgnoreCase)) &&
                (string.IsNullOrEmpty(messageContains) || (actualError.Message?.Contains(messageContains, StringComparison.OrdinalIgnoreCase) ?? false))
            );

            foundMatch.ShouldBeTrue(
                $"Did not find the expected validation error for Field: '{field}', ErrorCode: '{errorCode ?? "N/A"}', MessageContains: '{messageContains ?? "N/A"}'. {actualErrorsForDisplay()}");
        }

        logger.LogInformation(
            "Validation error assertions completed successfully for {ErrorCount} expected errors.",
            expectedErrors.Length);

        logger.LogInformation("Validation error assertions completed successfully.");
    }
}
