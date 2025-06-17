// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using BjjEire.Api.IntegrationTests.Data;
using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Api.IntegrationTests.TestBases;
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.Gyms.Commands;
using Shouldly;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.GymController;

[Trait("Category", "Parallel")]
[Trait("Category", "Gym")]
public class CreateGymControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ParallelTestBase(fixture, output) {

    [Fact]
    public async Task CreateGym_WithValidAuthentication_ShouldCreateGym() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var createdGymResponse = await Http.ReadAsJsonAsync<CreateGymResponse>(response);
        createdGymResponse.ShouldNotBeNull();
        createdGymResponse.Data.ShouldNotBeNull();
        createdGymResponse.Data.ShouldBeEquivalentTo(command.Data);
    }

    [Fact]
    public async Task CreateGym_WithoutAuthentication_ShouldReturnUnauthorized() {
        // Arrange
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateGym_WithNullData_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data", ValidationMessages.NotNull.ErrorCode, MessageContains: "Data cannot be null.")
        );

    }

    #region GymDto Name Validations
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateGym_WithInvalidName_ShouldReturnBadRequest(string? invalidName) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Name = invalidName!;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Name", ValidationMessages.Required.ErrorCode, MessageContains: "Name is required.")
        );
    }

    [Fact]
    public async Task CreateGym_WithNameTooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Name = new string('a', 101);

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Name", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Name cannot exceed 100 characters.")
        );
    }
    #endregion

    #region GymDto Description Validations
    [Fact]
    public async Task CreateGym_WithDescriptionTooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Description = new string('a', 201);

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Description", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Description cannot exceed 200 characters.")
        );
    }

    [Fact]
    public async Task CreateGym_WithNullDescription_ShouldBeAllowed() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Description = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }
    #endregion

    #region GymDto Enum Validations (Status, County)

    // [Fact]
    // public async Task CreateGym_WithInvalidStatus_ShouldReturnBadRequest()
    // {
    //     // Arrange
    //     await Auth.SetDefaultUserAuthTokenAsync();
    //     var commandJson = GymTestDataFactory.CreateGymCommandAsJson(dataOverrides: new { Status = 99 }); // Assuming 99 is not a valid enum int value
    //
    //     // Act
    //     var content = new StringContent(gymCommandJson, System.Text.Encoding.UTF8, "application/json");
    //     var response = await Http.PostAsync("api/gym", content);
    //
    //
    //     // Assert
    //     await AssertValidationErrorAsync(response, [
    //         (Field: "Data.Status",ValidationMessages.Invalid.ErrorCode, MessageContains: "Invalid Status.")
    //     ]);
    // }
    //
    // [Fact]
    // public async Task CreateGym_WithInvalidCounty_ShouldReturnBadRequest()
    // {
    //     // Arrange
    //     await Auth.SetDefaultUserAuthTokenAsync();
    //     // To test invalid enum, we often need to send an out-of-range integer or a non-matching string.
    //     // If your API binds enums from strings, test with an invalid string. If from integers, test with an invalid int.
    //     // The default ASP.NET Core behavior might convert an invalid integer to the enum's default (0) if not handled carefully by model binding or validation.
    //     // FluentValidation's IsInEnum should catch it if the model binder passes through an invalid value.
    //     var commandJson = GymTestDataFactory.CreateGymCommandAsJson(dataOverrides: new { County = "InvalidCountyString" }); // Or an int like 999
    //
    //     // Act
    //     var content = new StringContent(gymCommandJson, System.Text.Encoding.UTF8, "application/json");
    //     var response = await Http.PostAsync("api/gym", content);
    //
    //     // Assert
    //     await AssertValidationErrorAsync(response, [
    //         (Field: "Data.County",ValidationMessages.Invalid.ErrorCode, MessageContains: "Invalid County.")
    //     ]);
    // }
    #endregion

    #region GymDto Affiliation Validations

    [Fact]
    public async Task CreateGym_WithNullAffiliation_ShouldBeAllowed() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Affiliation = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateGym_WithAffiliationNameTooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Affiliation!.Name = new string('a', 101);

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Affiliation.Name", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Name cannot exceed 100 characters.")
        );
    }

    [Theory]
    [InlineData("invalid-url")]
    [InlineData("http:/missing-slash.com")]
    [InlineData("www.missing-scheme.com")]
    public async Task CreateGym_WithAffiliationWebsiteInvalidUrl_ShouldReturnBadRequest(string invalidUrl) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Affiliation!.Website = invalidUrl;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Affiliation.Website", ValidationMessages.InvalidUrl.ErrorCode, MessageContains: "Website must be a valid URL.")
        );
    }

    #endregion

    #region GymDto TrialOffer Validations
    [Fact]
    public async Task CreateGym_WithNullTrialOffer_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.TrialOffer = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.TrialOffer", ValidationMessages.NotNull.ErrorCode, MessageContains: "Trial Offer cannot be null.")
        );
    }

    [Fact]
    public async Task CreateGym_TrialOfferIsAvailableButNoDetails_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.TrialOffer.IsAvailable = true;
        command.Data.TrialOffer.FreeClasses = null;
        command.Data.TrialOffer.FreeDays = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.TrialOffer", ValidationMessages.ConditionalRequired.ErrorCode, MessageContains: "Trial Offer (FreeClasses or FreeDays) is required when IsAvailable is true.")
        );
    }

    [Fact]
    public async Task CreateGym_TrialOfferIsAvailableWithZeroFreeClasses_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.TrialOffer.IsAvailable = true;
        command.Data.TrialOffer.FreeClasses = 0;
        command.Data.TrialOffer.FreeDays = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert

        await AssertValidationErrorAsync(response,
            (Field: "Data.TrialOffer.FreeClasses", ValidationMessages.InclusiveBetweenValue.ErrorCode, MessageContains: "Free Classes must be between 1 and 10 inclusive."),
        (Field: "Data.TrialOffer.FreeClasses", ValidationMessages.PositiveOrNull.ErrorCode, MessageContains: "Free Classes must be null or positive when provided.")
        );
    }

    [Fact]
    public async Task CreateGym_TrialOfferIsAvailableWithExceededLimitFreeClasses_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.TrialOffer.IsAvailable = true;
        command.Data.TrialOffer.FreeClasses = 11;
        command.Data.TrialOffer.FreeDays = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.TrialOffer.FreeClasses", ValidationMessages.InclusiveBetweenValue.ErrorCode, MessageContains: $"Free Classes must be between 1 and 10 inclusive.")
        );
    }

    [Fact]
    public async Task CreateGym_TrialOfferIsAvailableWithZeroFreeDays_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.TrialOffer.IsAvailable = true;
        command.Data.TrialOffer.FreeClasses = null;
        command.Data.TrialOffer.FreeDays = 0;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.TrialOffer.FreeDays", ValidationMessages.PositiveOrNull.ErrorCode, MessageContains: "Free Days must be null or positive when provided."),
        (Field: "Data.TrialOffer.FreeDays", ValidationMessages.InclusiveBetweenValue.ErrorCode, MessageContains: "Free Days must be between 1 and 30 inclusive.")
        );
    }

    [Fact]
    public async Task CreateGym_TrialOfferIsAvailableWithExceededLimitFreeDays_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.TrialOffer.IsAvailable = true;
        command.Data.TrialOffer.FreeClasses = null;
        command.Data.TrialOffer.FreeDays = 31;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.TrialOffer.FreeDays", ValidationMessages.InclusiveBetweenValue.ErrorCode, MessageContains: $"Free Days must be between 1 and 30 inclusive.")
        );
    }

    [Fact]
    public async Task CreateGym_TrialOfferIsNotAvailableWithOutOfRangeFreeClasses_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.TrialOffer.IsAvailable = false;
        command.Data.TrialOffer.FreeClasses = 11;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.TrialOffer.FreeClasses", ValidationMessages.InclusiveBetweenValue.ErrorCode, MessageContains: "Free Classes must be between 1 and 10 inclusive.")
        );
    }

    [Fact]
    public async Task CreateGym_TrialOfferNotesTooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.TrialOffer.Notes = new string('a', 201);

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.TrialOffer.Notes", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Notes cannot exceed 200 characters.")
        );
    }

    #endregion

    #region GymDto SocialMedia Validations
    [Fact]
    public async Task CreateGym_WithNullSocialMedia_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.SocialMedia = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.SocialMedia", ValidationMessages.NotNull.ErrorCode, MessageContains: "Social Media cannot be null.")
        );
    }

    [Theory]
    [InlineData("Facebook", "invalid-fb-url")]
    [InlineData("Instagram", "not_a_url_insta")]
    [InlineData("X", "htp://x.com/invalid")]
    [InlineData("YouTube", "www.youtube.com/missingScheme")]
    public async Task CreateGym_SocialMediaWithInvalidUrlField_ShouldReturnBadRequest(string socialMediaField, string invalidUrl) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();

        switch (socialMediaField) {
            case "Facebook":
                command.Data.SocialMedia.Facebook = invalidUrl;
                break;
            case "Instagram":
                command.Data.SocialMedia.Instagram = invalidUrl;
                break;
            case "X":
                command.Data.SocialMedia.X = invalidUrl;
                break;
            case "YouTube":
                command.Data.SocialMedia.YouTube = invalidUrl;
                break;
            default:
                throw new ArgumentException("Invalid social media field name for test.");
        }

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: $"Data.SocialMedia.{socialMediaField}", ValidationMessages.InvalidUrl.ErrorCode, MessageContains: $"{socialMediaField} must be a valid URL.")
        );
    }

    [Fact]
    public async Task CreateGym_SocialMediaWithEmptyUrlFields_ShouldBeAllowed() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.SocialMedia.Facebook = string.Empty;
        command.Data.SocialMedia.Instagram = string.Empty;
        command.Data.SocialMedia.X = string.Empty;
        command.Data.SocialMedia.YouTube = string.Empty;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    public async Task CreateGym_SocialMediaWithNullUrlFields_ShouldBeAllowed() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.SocialMedia.Facebook = null!;
        command.Data.SocialMedia.Instagram = null!;
        command.Data.SocialMedia.X = null!;
        command.Data.SocialMedia.YouTube = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    #endregion

    #region GymDto Location Validations

    [Fact]
    public async Task CreateGym_WithNullLocation_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Location = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location", ValidationMessages.NotNull.ErrorCode, MessageContains: "Location cannot be null.")
      );
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateGym_LocationAddressInvalid_ShouldReturnBadRequest(string? invalidAddress) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Location.Address = invalidAddress!;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Address", ValidationMessages.Required.ErrorCode, MessageContains: "Address is required.")
        );
    }

    [Fact]
    public async Task CreateGym_LocationAddressTooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Location.Address = new string('a', 101);

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Address", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Address cannot exceed 100 characters.")
        );
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateGym_LocationVenueInvalid_ShouldReturnBadRequest(string? invalidVenue) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Location.Venue = invalidVenue!;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Venue", ValidationMessages.Required.ErrorCode, MessageContains: "Venue is required.")
        );
    }

    [Fact]
    public async Task CreateGym_LocationVenueTooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Location.Venue = new string('a', 101);

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Venue", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Venue cannot exceed 100 characters.")
        );
    }

    [Fact]
    public async Task CreateGym_LocationCoordinatesNull_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Location.Coordinates = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Coordinates", ValidationMessages.NotNull.ErrorCode, MessageContains: "Coordinates cannot be null.")
        );
    }

    #endregion

    #region GymDto Location.Coordinates (GeoCoordinatesDto) Validations
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateGym_CoordinatesTypeInvalid_ShouldReturnBadRequest(string? invalidType) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Location.Coordinates.Type = invalidType!;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Coordinates.Type", ValidationMessages.Required.ErrorCode, MessageContains: "Type is required.")
      );
    }

    [Fact]
    public async Task CreateGym_CoordinatesTypeTooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Location.Coordinates.Type = new string('a', 51);

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Coordinates.Type", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Type cannot exceed 50 characters.")
        );
    }

    [Theory]
    [InlineData(-90.1)]
    [InlineData(90.1)]
    public async Task CreateGym_CoordinatesLatitudeOutOfRange_ShouldReturnBadRequest(double invalidLatitude) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Location.Coordinates.Latitude = invalidLatitude;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Coordinates.Latitude", ValidationMessages.InclusiveBetweenValue.ErrorCode, MessageContains: "Latitude must be between -90 and 90 inclusive.")
      );
    }

    [Theory]
    [InlineData(-180.1)]
    [InlineData(180.1)]
    public async Task CreateGym_CoordinatesLongitudeOutOfRange_ShouldReturnBadRequest(double invalidLongitude) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Location.Coordinates.Longitude = invalidLongitude;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Coordinates.Longitude", ValidationMessages.InclusiveBetweenValue.ErrorCode, MessageContains: "Longitude must be between -180 and 180 inclusive.")
        );
    }

    [Fact]
    public async Task CreateGym_CoordinatesPlaceNameTooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Location.Coordinates.PlaceName = new string('a', 101);

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Coordinates.PlaceName", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Place Name cannot exceed 100 characters.")
        );
    }

    [Fact]
    public async Task CreateGym_CoordinatesPlaceIdTooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Location.Coordinates.PlaceId = new string('a', 25);

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Coordinates.PlaceId", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Place ID cannot exceed 24 characters.")
        );
    }

    #endregion

    #region GymDto URL Validations

    [Theory]
    [InlineData("Data.Website", "invalid-url", "Website must be a valid URL.")]
    [InlineData("Data.Website", "http:/missing-slash.com", "Website must be a valid URL.")]
    [InlineData("Data.TimetableUrl", "invalid-url", "Timetable URL must be a valid URL.")]
    [InlineData("Data.ImageUrl", "www.no-scheme.com", "Image URL must be a valid URL.")]
    public async Task CreateGym_WithInvalidOptionalUrls_ShouldReturnBadRequest(string fieldName, string invalidUrl, string expectedMessage) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();

        switch (fieldName) {
            case "Data.Website":
                command.Data.Website = invalidUrl;
                break;
            case "Data.TimetableUrl":
                command.Data.TimetableUrl = invalidUrl;
                break;
            case "Data.ImageUrl":
                command.Data.ImageUrl = invalidUrl;
                break;
        }

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: fieldName, ValidationMessages.InvalidUrl.ErrorCode, MessageContains: expectedMessage)
        );
    }

    [Fact]
    public async Task CreateGym_WithNullOptionalUrls_ShouldBeAllowed() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = GymTestDataFactory.GetValidCreateGymCommand();
        command.Data.Website = null;
        command.Data.TimetableUrl = null;
        command.Data.ImageUrl = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/gym", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    #endregion


}

