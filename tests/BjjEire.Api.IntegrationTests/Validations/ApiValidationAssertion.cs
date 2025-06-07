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

        logger.LogInformation(TestLoggingEvents.TestLifecycle.ValidationAssertionStarting,
            "Asserting validation error. Expecting {ErrorCount} criteria.", expectedErrors.Length);

        var responseContentForError = await response.Content.ReadAsStringAsync();

        if (response.StatusCode != HttpStatusCode.BadRequest)
        {
            logger.LogError(TestLoggingEvents.TestLifecycle.AssertionFailed,
                "Expected status code 400 Bad Request, but got {StatusCode}. Response: {ResponseContent}",
                (int)response.StatusCode, responseContentForError);
            response.StatusCode.ShouldBe(HttpStatusCode.BadRequest, $"Response: {responseContentForError}");
        }

        logger.LogDebug(TestLoggingEvents.TestLifecycle.RawJsonResponse,
            "Raw JSON response for validation error: {JsonResponse}", responseContentForError);

        ValidationErrorResponse? errorResponse;
        try
        {
            errorResponse = JsonSerializer.Deserialize<ValidationErrorResponse>(responseContentForError, TestJsonHelper.SerializerOptions);
        }
        catch (JsonException jsonEx)
        {
            logger.LogError(TestLoggingEvents.TestLifecycle.AssertionFailed, jsonEx,
                "JSON Deserialization Failed for validation error response. Raw JSON: {JsonResponse}",
                responseContentForError);
            // Re-throw as an InvalidOperationException to fail the test with clear context.
            throw new InvalidOperationException(
                $"Failed to deserialize validation error response. Raw JSON: {responseContentForError}", jsonEx);
        }

        try
        {
            errorResponse.ShouldNotBeNull("Deserialized validation error response was null.");
            errorResponse.Status.ShouldBe(StatusCodes.Status400BadRequest, "Expected status code 400 in response body.");
            errorResponse.Title.ShouldBe("Validation Failed", "Expected title 'Validation Failed'.");
            errorResponse.Errors.ShouldNotBeNull("Errors collection should not be null.");

            var actualErrorsForDisplay = () => $"Actual errors: [{string.Join("; ", errorResponse.Errors.Select(err => $"Field: '{err.Field}', Code: '{err.ErrorCode}', Msg: '{err.Message}'"))}]";

            errorResponse.Errors.Count.ShouldBe(expectedErrors.Length,
                $"Expected {expectedErrors.Length} validation errors, but found {errorResponse.Errors.Count}. {actualErrorsForDisplay()}");

            foreach (var (field, errorCode, messageContains) in expectedErrors)
            {
                var foundMatch = errorResponse.Errors.Any(actualError =>
                    string.Equals(actualError.Field, field, StringComparison.OrdinalIgnoreCase) &&
                    (string.IsNullOrEmpty(errorCode) || string.Equals(actualError.ErrorCode, errorCode, StringComparison.OrdinalIgnoreCase)) &&
                    (string.IsNullOrEmpty(messageContains) || (actualError.Message?.Contains(messageContains, StringComparison.OrdinalIgnoreCase) ?? false))
                );

                foundMatch.ShouldBeTrue(
                    $"Did not find expected validation error for Field: '{field}', ErrorCode: '{errorCode ?? "N/A"}'. {actualErrorsForDisplay()}");
            }
        }
        catch (Exception ex)
        {
            // Catch assertion exceptions (e.g., from Shouldly) and log them with our specific EventId.
            logger.LogError(TestLoggingEvents.TestLifecycle.AssertionFailed, ex,
                "Validation assertion failed. Expected Errors: {ExpectedErrors}, Actual Response: {ActualResponse}",
                expectedErrors, errorResponse);
            // Re-throw the original exception to ensure the test fails correctly.
            throw;
        }

        logger.LogInformation(TestLoggingEvents.TestLifecycle.ValidationAssertionPassed,
            "Validation error assertions passed successfully for {ErrorCount} expected errors.", expectedErrors.Length);
    }
}
