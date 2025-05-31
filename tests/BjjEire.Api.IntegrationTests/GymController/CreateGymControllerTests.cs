// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using System.Net.Http.Json;
using BjjEire.Api.IntegrationTests.Common;
using BjjEire.Api.IntegrationTests.Data;
using BjjEire.Application.Features.Gyms.Commands;
using BjjEire.Application.Features.Gyms.DTOs;
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

            // Act
            var response = await HttpClient.PostAsJsonAsync("api/gym", gymCommand, TestJsonHelper.SerializerOptions);

            // Assert
            response.StatusCode.ShouldBe(HttpStatusCode.Created);

            var createdGymResponse = await response.Content.ReadFromJsonAsync<CreateGymResponse>(TestJsonHelper.SerializerOptions);
            createdGymResponse.ShouldNotBeNull();
            createdGymResponse.Data.ShouldNotBeNull();
            createdGymResponse.Data.ShouldBeEquivalentTo(gymCommand.Data);
        }

    [Fact]
    public async Task CreateGym_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        var gymCommand = GymTestDataFactory.CreateGymCommandGenerator.Generate();
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await HttpClient.PostAsJsonAsync("api/gym", gymCommand, TestJsonHelper.SerializerOptions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData(null, "FIELD_REQUIRED", "Gym name is required.")]
    [InlineData("", "FIELD_REQUIRED", "Gym name is required.")]
    [InlineData("   ", "FIELD_REQUIRED", "Gym name is required.")]
    public async Task CreateGym_WithInvalidName_ShouldReturnBadRequest(string? invalidName, string expectedErrorCode, string expectedMessageContains)
    {
        // Arrange
        await SetDefaultUserAuthTokenAsync();
        var gymCommand = GymTestDataFactory.CreateGymCommandGenerator.Generate();
        gymCommand.Data.Name = invalidName!;

        // Act
        var response = await HttpClient.PostAsJsonAsync("api/gym", gymCommand, TestJsonHelper.SerializerOptions);

        // Assert
        await AssertValidationErrorAsync(response, [
            (Field: "Data.Name", ErrorCode: expectedErrorCode, MessageContains: expectedMessageContains)
        ]);
    }

    [Fact]
    public async Task CreateGym_WithMaximumLengthExceededDescription_ShouldReturnBadRequest()
    {
        // Arrange
        await SetDefaultUserAuthTokenAsync();
        var gymCommand = GymTestDataFactory.CreateGymCommandGenerator.Generate();
        gymCommand.Data.Description = "Team Apex BJJ offers elite training in Brazilian Jiu-Jitsu, Muay Thai, and MMA. Our Dublin facility provides expert coaching, a supportive community, and flexible classes for all skill levels and ages.";

        // Act
        var response = await HttpClient.PostAsJsonAsync("api/gym", gymCommand, TestJsonHelper.SerializerOptions);

        // Assert
        await AssertValidationErrorAsync(response, [
            (Field: "Data.Description", ErrorCode: "MAX_LENGTH_EXCEEDED", MessageContains: "Description cannot exceed 200 characters.")
        ]);
    }

}

