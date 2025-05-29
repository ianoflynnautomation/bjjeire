// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using System.Net.Http.Json;
using BjjEire.Api.Extensions.Exceptions;
using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Api.IntegrationTests.Data;
using BjjEire.Application.Features.Gyms.Commands;
using BjjEire.Application.Features.Gyms.DTOs;
using Microsoft.AspNetCore.Http;
using Shouldly;
using Xunit;

namespace BjjEire.Api.IntegrationTests.GymController;

public class CreateGymControllerTests(CustomApiFactory apiFactory)
    : IntegrationTestBase<CustomApiFactory>(apiFactory)
{
    [Fact]
    public async Task CreateGym_WithValidData_ShouldCreateGym()
        {
            // Arrange
            await SetDefaultUserAuthTokenAsync();

            var gymCommand = GymTestDataFactory.CreateGymCommandGenerator.Generate();
            var gymDto = gymCommand.Model;

            // Act
            var response = await HttpClient.PostAsJsonAsync("api/gym", gymDto, TestJsonHelper.SerializerOptions);

            // Assert
            response.StatusCode.ShouldBe(HttpStatusCode.Created);

            var createdGymResponse =
                await response.Content.ReadFromJsonAsync<CreateGymResponse>(TestJsonHelper.SerializerOptions);
            createdGymResponse.ShouldNotBeNull();
            createdGymResponse.Model.ShouldNotBeNull();
            createdGymResponse.Model.Id.ShouldBe(gymDto.Id);
            createdGymResponse.Model.Name.ShouldBe(gymDto.Name);
    }

    [Fact]
    public async Task CreateGym_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        var gymCommand = GymTestDataFactory.CreateGymCommandGenerator.Generate();
        var gymDto = gymCommand.Model;
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await HttpClient.PostAsJsonAsync("api/gym", gymDto, TestJsonHelper.SerializerOptions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }


    // [Theory]
    // [InlineData("invalid-url")]
    // [InlineData("http:/missing-slash.com")]
    // [InlineData("www.missing-scheme.com")]
    // public async Task CreateGym_WithInvalidWebsiteUrl_ShouldReturnBadRequest(string invalidUrl)
    // {
    //     // Arrange
    //     var gymCommand = GymTestDataFactory.CreateGymCommandGenerator.Generate();
    //     var gymDto = gymCommand.Model;
    //     gymDto.Website = invalidUrl;
    //
    //     // Act
    //     var response = await HttpClient.PostAsJsonAsync("api/gym", gymDto, TestJsonHelper.SerializerOptions);
    //
    //     // Assert
    //     await AssertValidationErrorAsync(response, nameof(GymDto.Website), expectedMessageContains: "must be a valid URL");
    // }
    //
    // private async Task AssertValidationErrorAsync(HttpResponseMessage response, string expectedField, string? expectedErrorCode = null, string? expectedMessageContains = null)
    // {
    //     response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    //     var errorResponse = await response.Content.ReadFromJsonAsync<ValidationErrorResponse>(TestJsonHelper.SerializerOptions);
    //
    //     errorResponse.ShouldNotBeNull();
    //     errorResponse.Status.ShouldBe(StatusCodes.Status400BadRequest);
    //     errorResponse.Title.ShouldBe("Validation Failed");
    //     errorResponse.Type.ShouldBe("urn:bjjeire:validation-error");
    //     errorResponse.Errors.ShouldNotBeNull();
    //     errorResponse.Errors.ShouldNotBeEmpty();
    //
    //     var fieldError = errorResponse.Errors.FirstOrDefault(e =>
    //             string.Equals(e.Field, expectedField, StringComparison.OrdinalIgnoreCase) // Match field name (likely PascalCase from PropertyName)
    //     );
    //
    //     fieldError.ShouldNotBeNull($"Expected an error for field '{expectedField}'. " +
    //                                $"Actual errors: [{string.Join(", ", errorResponse.Errors.Select(err => $"'{err.Field}': {err.Message}"))}]");
    //
    //     if (!string.IsNullOrEmpty(expectedErrorCode))
    //     {
    //         fieldError.ErrorCode.ShouldBe(expectedErrorCode, $"Error code for field '{expectedField}' did not match.");
    //     }
    //
    //     if (!string.IsNullOrEmpty(expectedMessageContains))
    //     {
    //         fieldError.Message.ShouldContain(expectedMessageContains, Case.Insensitive, $"Error message for field '{expectedField}' did not contain expected text.");
    //     }
    //}

}

