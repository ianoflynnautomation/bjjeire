// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Application.Features.Gyms.Commands;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.GymControllerTests;

[Trait("Category", "Parallel")]
[Trait("Category", "Gym")]
[Trait("Category", "Integration")]
public class CreateGymControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ParallelTestBase(fixture, output)
{
    [Fact]
    public async Task CreateGym_WithValidData_ShouldCreateGymAsync()
    {
        // Arrange
        SetDefaultUserToken();
        var command = GymTestDataFactory.GetValidCreateGymCommand();

        // Act
        var response = await HttpClient.PostAsJsonAsync("api/gym", command, TestJsonHelper.SerializerOptions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var createdGymResponse = await ReadJsonAsync<CreateGymResponse>(response);
        _ = createdGymResponse.ShouldNotBeNull();
        _ = createdGymResponse.Data.ShouldNotBeNull();
        createdGymResponse.Data.ShouldBeEquivalentTo(command.Data);
    }

    [Fact]
    public async Task CreateGym_WithoutAuthentication_ShouldReturnUnauthorizedAsync()
    {
        // Arrange
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await HttpClient.PostAsJsonAsync("api/gym", command, TestJsonHelper.SerializerOptions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateGym_WithInvalidPayload_ReturnsValidationErrorContractAsync()
    {
        // Arrange
        SetDefaultUserToken();
        var command = new CreateGymCommand { Data = null! };

        // Act
        var response = await HttpClient.PostAsJsonAsync("api/gym", command, TestJsonHelper.SerializerOptions);

        // Assert
        await HttpResponseAssertions.AssertValidationErrorContractAsync(response);
    }

    [Fact]
    public async Task CreateGym_WithMultipleInvalidFields_ReturnsAllErrorsAsync()
    {
        // Arrange
        SetDefaultUserToken();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Name = "";
        command.Data.TrialOffer = null!;
        command.Data.SocialMedia = null!;
        command.Data.Location = null!;

        // Act
        var response = await HttpClient.PostAsJsonAsync("api/gym", command, TestJsonHelper.SerializerOptions);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Name", ErrorCode: null, MessageContains: null),
            (Field: "Data.TrialOffer", ErrorCode: null, MessageContains: null),
            (Field: "Data.SocialMedia", ErrorCode: null, MessageContains: null),
            (Field: "Data.Location", ErrorCode: null, MessageContains: null)
        );
    }

    [Fact]
    public async Task CreateGym_SocialMediaOptionalUrls_AllowEmptyAndNullAsync()
    {
        // Arrange
        SetDefaultUserToken();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.SocialMedia.Facebook = null!;
        command.Data.SocialMedia.Instagram = string.Empty;
        command.Data.SocialMedia.X = null!;
        command.Data.SocialMedia.YouTube = string.Empty;

        // Act
        var response = await HttpClient.PostAsJsonAsync("api/gym", command, TestJsonHelper.SerializerOptions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateGym_OptionalTopLevelFields_AllowNullAsync()
    {
        // Arrange
        SetDefaultUserToken();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Description = null;
        command.Data.Affiliation = null;
        command.Data.Website = null;
        command.Data.TimetableUrl = null;
        command.Data.ImageUrl = null;

        // Act
        var response = await HttpClient.PostAsJsonAsync("api/gym", command, TestJsonHelper.SerializerOptions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }
}
