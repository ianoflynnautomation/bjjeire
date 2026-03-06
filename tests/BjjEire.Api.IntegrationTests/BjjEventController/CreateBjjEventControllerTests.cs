// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using BjjEire.Api.IntegrationTests.Data;
using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Api.IntegrationTests.TestBases;
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Enums;
using Shouldly;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.BjjEventController;

[Trait("Category", "Parallel")]
[Trait("Category", "BjjEvent")]
public class CreateBjjEventControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ParallelTestBase(fixture, output) {

    [Fact]
    public async Task CreateBjjEvent_WithValidData_ShouldCreateBjjEvent() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var createdBjjEventResponse = await Http.ReadAsJsonAsync<CreateBjjEventResponse>(response);

        createdBjjEventResponse.ShouldNotBeNull();
        createdBjjEventResponse.Data.ShouldNotBeNull();
        createdBjjEventResponse.Data.ShouldBeEquivalentTo(command.Data);
    }

    [Fact]
    public async Task CreateBjjEvent_WithoutAuthentication_ShouldReturnUnauthorized() {
        // Arrange
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateBjjEvent_WithNullData_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = new CreateBjjEventCommand { Data = null! };

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data", ValidationMessages.NotNull.ErrorCode, MessageContains: "Data cannot be null.")
        );
    }

    #region BjjEventDto - Top Level Field Validations

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateBjjEvent_Name_Invalid_ShouldReturnBadRequest(string? invalidName) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Name = invalidName!;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Name", ValidationMessages.Required.ErrorCode, MessageContains: "Event Name is required.")
        );
    }

    [Fact]
    public async Task CreateBjjEvent_Name_TooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Name = new string('A', 101);

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Name", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Event Name cannot exceed 100 characters.")
      );
    }

    [Fact]
    public async Task CreateBjjEvent_Description_TooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Description = new string('A', 201);

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Description", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Description cannot exceed 200 characters.")
        );
    }


    // [Fact]
    // public async Task CreateBjjEvent_EventType_Invalid_ShouldReturnBadRequest()
    // {
    //     // Arrange
    //     await Auth.SetDefaultUserAuthTokenAsync();
    //     // To test invalid enum, send an out-of-range integer or a non-matching string if API binds from strings.
    //     var rawCommand = TestJsonHelper.SerializeObjectWithOverride(
    //         BjjEventTestDataFactory.GetValidBjjEventCommand(),
    //         new Dictionary<string, object> { { "Data.Type", 999 } }
    //     );
    //
    //     // Act
    //     var content = new StringContent(rawCommand, System.Text.Encoding.UTF8, "application/json");
    //     var response = await Http.PostAsync("api/bjjevent", content);
    //
    //     // Assert
    //     await AssertValidationErrorAsync(response, [
    //         (Field: "Data.Type", ValidationMessages.Invalid.ErrorCode, MessageContains: "Invalid Event Type.")
    //     ]);
    // }

    // [Fact]
    // public async Task CreateBjjEvent_Status_Invalid_ShouldReturnBadRequest()
    // {
    //     // Arrange
    //     await Auth.SetDefaultUserAuthTokenAsync();
    //     var rawCommand = TestJsonHelper.SerializeObjectWithOverride(
    //         BjjEventTestDataFactory.GetValidBjjEventCommand(),
    //         new Dictionary<string, object> { { "Data.Status", "NonExistentStatus" } }
    //     );
    //
    //     // Act
    //     var content = new StringContent(rawCommand, System.Text.Encoding.UTF8, "application/json");
    //     var response = await Http.PostAsync("api/bjjevent", content);
    //
    //     // Assert
    //     await AssertValidationErrorAsync(response, [
    //         (Field: "Data.Status", ValidationMessages.Invalid.ErrorCode, MessageContains: "Invalid Event Status.")
    //     ]);
    // }

    [Fact]
    public async Task CreateBjjEvent_StatusReason_TooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.StatusReason = new string('A', 101);

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.StatusReason", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Status Reason cannot exceed 100 characters.")
        );
    }

    // [Fact]
    // public async Task CreateBjjEvent_County_Invalid_ShouldReturnBadRequest()
    // {
    //     // Arrange
    //     await Auth.SetDefaultUserAuthTokenAsync();
    //     var rawCommand = TestJsonHelper.SerializeObjectWithOverride(
    //         BjjEventTestDataFactory.GetValidBjjEventCommand(),
    //         new Dictionary<string, object> { { "Data.County", "InvalidCountyValue" } }
    //     );
    //
    //     // Act
    //     var content = new StringContent(rawCommand, System.Text.Encoding.UTF8, "application/json");
    //     var response = await Http.PostAsync("api/bjjevent", content);
    //
    //     // Assert
    //     await AssertValidationErrorAsync(response, [
    //         (Field: "Data.County", ValidationMessages.Invalid.ErrorCode, MessageContains: "Invalid County.")
    //     ]);
    // }

    [Theory]
    [InlineData("Data.EventUrl", "not-a-valid-url", "Event URL must be a valid URL.")]
    [InlineData("Data.ImageUrl", "htp://www.domain.com", "Image URL must be a valid URL.")]
    public async Task CreateBjjEvent_UrlFields_Invalid_ShouldReturnBadRequest(string fieldPath, string invalidUrl, string expectedMessage) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        switch (fieldPath) {
            case "Data.EventUrl":
                command.Data.EventUrl = invalidUrl;
                break;
            case "Data.ImageUrl":
                command.Data.ImageUrl = invalidUrl;
                break;
        }

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: fieldPath, ValidationMessages.InvalidUrl.ErrorCode, MessageContains: expectedMessage)
        );
    }

    #endregion

    #region Organiser Validations (BjjEventDto.Organiser)

    [Fact]
    public async Task CreateBjjEvent_Organiser_Null_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Organiser = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Organiser", ValidationMessages.NotNull.ErrorCode, MessageContains: "Organiser cannot be null.")
        );
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateBjjEvent_Organiser_Name_Invalid_ShouldReturnBadRequest(string? invalidName) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Organiser.Name = invalidName!;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Organiser.Name", ValidationMessages.Required.ErrorCode, MessageContains: "Name is required.")
        );
    }

    [Fact]
    public async Task CreateBjjEvent_Organiser_Name_TooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Organiser.Name = new string('A', 101);

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Organiser.Name", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Name cannot exceed 100 characters.")
        );
    }

    [Fact]
    public async Task CreateBjjEvent_Organiser_Website_InvalidUrl_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Organiser.Website = "invalid-website-url";

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Organiser.Website", ValidationMessages.InvalidUrl.ErrorCode, MessageContains: "Website must be a valid URL.")
        );
    }

    #endregion

    #region BjjEventDto SocialMedia Validations
    [Fact]
    public async Task BjjEvent_WithNullSocialMedia_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.SocialMedia = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

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
    public async Task BjjEvent_SocialMediaWithInvalidUrlField_ShouldReturnBadRequest(string socialMediaField, string invalidUrl) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();

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
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: $"Data.SocialMedia.{socialMediaField}", ValidationMessages.InvalidUrl.ErrorCode, MessageContains: $"{socialMediaField} must be a valid URL.")
        );
    }

    [Fact]
    public async Task BjjEvent_SocialMediaWithEmptyUrlFields_ShouldBeAllowed() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.SocialMedia.Facebook = string.Empty;
        command.Data.SocialMedia.Instagram = string.Empty;
        command.Data.SocialMedia.X = string.Empty;
        command.Data.SocialMedia.YouTube = string.Empty;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    public async Task BjjEvent_SocialMediaWithNullUrlFields_ShouldBeAllowed() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.SocialMedia.Facebook = null!;
        command.Data.SocialMedia.Instagram = null!;
        command.Data.SocialMedia.X = null!;
        command.Data.SocialMedia.YouTube = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    #endregion

    #region GymDto Location Validations

    [Fact]
    public async Task BjjEvent_WithNullLocation_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Location = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location", ValidationMessages.NotNull.ErrorCode, MessageContains: "Location cannot be null.")
        );
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task BjjEvent_LocationAddressInvalid_ShouldReturnBadRequest(string? invalidAddress) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Location.Address = invalidAddress!;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Address", ValidationMessages.Required.ErrorCode, MessageContains: "Address is required.")
        );
    }

    [Fact]
    public async Task BjjEvent_LocationAddressTooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Location.Address = new string('a', 101);

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Address", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Address cannot exceed 100 characters.")
        );
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task BjjEvent_LocationVenueInvalid_ShouldReturnBadRequest(string? invalidVenue) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Location.Venue = invalidVenue!;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Venue", ValidationMessages.Required.ErrorCode, MessageContains: "Venue is required.")
        );
    }

    [Fact]
    public async Task BjjEvent_LocationVenueTooLong_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Location.Venue = new string('a', 101);

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Venue", ValidationMessages.MaxLength.ErrorCode, MessageContains: "Venue cannot exceed 100 characters.")
        );
    }

    [Fact]
    public async Task BjjEvent_LocationCoordinatesNull_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Location.Coordinates = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Location.Coordinates", ValidationMessages.NotNull.ErrorCode, MessageContains: "Coordinates cannot be null.")
        );
    }

    #endregion

    #region Schedule Validations (BjjEventDto.Schedule)

    [Fact]
    public async Task CreateBjjEvent_Schedule_Null_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Schedule = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Schedule", ValidationMessages.NotNull.ErrorCode, MessageContains: "Schedule cannot be null.")
        );
    }

    // [Fact]
    // public async Task CreateBjjEvent_Schedule_Type_Invalid_ShouldReturnBadRequest()
    // {
    //     // Arrange
    //     await Auth.SetDefaultUserAuthTokenAsync();
    //     var rawCommand = TestJsonHelper.SerializeObjectWithOverride(
    //         BjjEventTestDataFactory.GetValidBjjEventCommand(),
    //         new Dictionary<string, object> { { "Data.Schedule.ScheduleType", "InvalidScheduleTypeString" } }
    //     );
    //
    //     // Act
    //     var content = new StringContent(rawCommand, System.Text.Encoding.UTF8, "application/json");
    //     var response = await Http.PostAsync("api/bjjevent", content);
    //
    //     // Assert
    //     await AssertValidationErrorAsync(response, [
    //         (Field: "Data.Schedule.ScheduleType", ValidationMessages.Invalid.ErrorCode, MessageContains: "Invalid Schedule Type.")
    //     ]);
    // }

    [Fact]
    public async Task CreateBjjEvent_Schedule_EndDateBeforeStartDate_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Schedule.StartDate = DateTime.UtcNow.AddDays(1);
        command.Data.Schedule.EndDate = DateTime.UtcNow;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Schedule.EndDate", ValidationMessages.GreaterThanOrEqual.ErrorCode, MessageContains: "End Date must be on or after Start Date.")
        );
    }

    [Fact]
    public async Task CreateBjjEvent_Schedule_Hours_Null_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Schedule.Hours = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Schedule.Hours", ValidationMessages.NotNull.ErrorCode, MessageContains: "Hours cannot be null.")
        );
    }

    [Fact]
    public async Task CreateBjjEvent_Schedule_HoursListIsEmpty_ShouldReturnBadRequest() {
        // ARRANGE
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Schedule.Hours = [];

        // ACT
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // ASSERT
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        await AssertValidationErrorAsync(response,
            (Field: "Data.Schedule.Hours", ValidationMessages.Required.ErrorCode, MessageContains: "Hours is required.")
        );
    }

    [Fact]
    public async Task CreateBjjEvent_Schedule_HoursListContainsNullEntry_ShouldReturnBadRequest() {
        // ARRANGE
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();

        var validHourEntry = new BjjEventHoursDto { Day = DayOfWeek.Monday, OpenTime = new TimeSpan(9, 0, 0), CloseTime = new TimeSpan(10, 0, 0) };
        command.Data.Schedule.Hours =
        [
            validHourEntry,
          null!
        ];

        // ACT
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // ASSERT
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        await AssertValidationErrorAsync(response,
            (Field: "Data.Schedule.Hours", ValidationMessages.NoNullEntries.ErrorCode, MessageContains: "Event Hours cannot contain null entries.")
        );
    }

    // [Fact]
    // public async Task CreateBjjEvent_Schedule_Hours_InvalidEntry_Day_ShouldReturnBadRequest()
    // {
    //     // Arrange
    //     await Auth.SetDefaultUserAuthTokenAsync();
    //     var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
    //     // Ensure Hours is not null and has at least one item
    //     command.Data.Schedule.Hours ??= [];
    //     if (!command.Data.Schedule.Hours.Any())
    //     {
    //         command.Data.Schedule.Hours.Add(new BjjEventHoursDto { Day = DayOfWeek.Monday, OpenTime = new TimeSpan(9,0,0), CloseTime = new TimeSpan(10,0,0)});
    //     }
    //     // Invalidate the day of the first hour entry - by sending an invalid enum value
    //     var rawCommand = TestJsonHelper.SerializeObjectWithOverride(
    //         command,
    //         new Dictionary<string, object> { { $"Data.Schedule.Hours[0].Day", 99 } } // Assuming 99 is invalid for DayOfWeek
    //     );
    //
    //     // Act
    //     var content = new StringContent(rawCommand, System.Text.Encoding.UTF8, "application/json");
    //     var response = await Http.PostAsync("api/bjjevent", content);
    //
    //     // Assert
    //     await AssertValidationErrorAsync(response, [
    //         (Field: "Data.Schedule.Hours[0].Day", ValidationMessages.Invalid.ErrorCode, MessageContains: "Invalid Day.")
    //     ]);
    // }

    [Fact]
    public async Task CreateBjjEvent_Schedule_Hours_InvalidEntry_CloseTimeBeforeOpenTime_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Schedule.Hours![0].OpenTime = new TimeSpan(12, 0, 0);
        command.Data.Schedule.Hours[0].CloseTime = new TimeSpan(10, 0, 0);

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Schedule.Hours[0].CloseTime", ValidationMessages.GreaterThan.ErrorCode, MessageContains: "Close Time must be greater than Open Time.")
        );
    }

    #endregion

    #region Pricing Validations (BjjEventDto.Pricing) - REFACTORED

    [Fact]
    public async Task CreateBjjEvent_Pricing_Null_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing = null!;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Pricing", ValidationMessages.NotNull.ErrorCode, MessageContains: "Pricing cannot be null.")
        );
    }

    // [Fact]
    // public async Task CreateBjjEvent_Pricing_Type_Invalid_ShouldReturnBadRequest()
    // {
    //     // Arrange
    //     await Auth.SetDefaultUserAuthTokenAsync();
    //     var rawCommand = TestJsonHelper.SerializeObjectWithOverride(
    //         BjjEventTestDataFactory.GetValidBjjEventCommand(),
    //         new Dictionary<string, object> { { "Data.Pricing.Type", "InvalidPricingTypeStringOrInt" } }
    //     );
    //
    //     // Act
    //     var content = new StringContent(rawCommand, System.Text.Encoding.UTF8, "application/json");
    //     var response = await Http.PostAsync("api/bjjevent", content);
    //
    //     // Assert
    //     // PricingModelDtoValidator applies ApplyEnumValidator("Pricing Type") to Type.
    //     // ApplyEnumValidator uses ValidationMessages.Invalid.
    //     // PropertyName will be "Pricing Type".
    //     await AssertValidationErrorAsync(response, [
    //         (Field: "Data.Pricing.Type", ValidationMessages.Invalid.ErrorCode, MessageContains: "Invalid Pricing Type.")
    //     ]);
    // }

    [Fact]
    public async Task CreateBjjEvent_Pricing_TypeFree_AmountNotZero_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = PricingType.Free;
        command.Data.Pricing.Amount = 10m; // Invalid
        command.Data.Pricing.Currency = null;
        command.Data.Pricing.DurationDays = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Pricing.Amount", "MUST_BE_ZERO_WHEN_FREE", MessageContains: "Amount must be 0 when Pricing Type is Free.")
        );
    }

    [Fact]
    public async Task CreateBjjEvent_Pricing_TypeFree_CurrencyNotNull_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = PricingType.Free;
        command.Data.Pricing.Amount = 0m;
        command.Data.Pricing.Currency = "EUR";
        command.Data.Pricing.DurationDays = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Pricing.Currency", ValidationMessages.MustBeNull.ErrorCode, MessageContains: "Currency must be null when Pricing Type is Free.")
        );
    }

    [Fact]
    public async Task CreateBjjEvent_Pricing_TypeFree_DurationDaysNotNull_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = PricingType.Free;
        command.Data.Pricing.Amount = 0m;
        command.Data.Pricing.Currency = null;
        command.Data.Pricing.DurationDays = 1;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Pricing.DurationDays", ValidationMessages.MustBeNull.ErrorCode, MessageContains: "Duration Days must be null when Pricing Type is Free.")
        );
    }

    [Fact]
    public async Task CreateBjjEvent_Pricing_TypeFree_Valid_ShouldPass() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = PricingType.Free;
        command.Data.Pricing.Amount = 0m;
        command.Data.Pricing.Currency = null;
        command.Data.Pricing.DurationDays = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Theory]
    [InlineData(0.0)]
    [InlineData(-10.0)]
    public async Task CreateBjjEvent_Pricing_PaidType_AmountNotPositive_ShouldReturnBadRequest(decimal invalidAmount) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = PricingType.FlatRate;
        command.Data.Pricing.Amount = invalidAmount;
        command.Data.Pricing.Currency = "EUR";
        command.Data.Pricing.DurationDays = 1;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Pricing.Amount", "MUST_BE_POSITIVE_FOR_PAID", MessageContains: "Amount must be greater than 0.")
        );
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public async Task CreateBjjEvent_Pricing_PaidType_Currency_NullOrEmpty_ShouldReturnBadRequest(string? invalidCurrency) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = PricingType.FlatRate;
        command.Data.Pricing.Amount = 50m;
        command.Data.Pricing.Currency = invalidCurrency;
        command.Data.Pricing.DurationDays = 1;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Pricing.Currency", ValidationMessages.Required.ErrorCode, MessageContains: "Currency is required.")
        );
    }

    [Fact]
    public async Task CreateBjjEvent_Pricing_PaidType_Currency_InvalidFormat_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = PricingType.FlatRate;
        command.Data.Pricing.Amount = 50m;
        command.Data.Pricing.Currency = "INVALID_CURRENCY";
        command.Data.Pricing.DurationDays = 1;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Pricing.Currency", ValidationMessages.InvalidFormat.ErrorCode, MessageContains: "Currency must be a valid ISO 4217 currency code (e.g., EUR, USD).")
        );
    }

    [Fact]
    public async Task CreateBjjEvent_Pricing_TypeFlatRate_DurationDaysNull_ShouldReturnBadRequest() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = PricingType.FlatRate;
        command.Data.Pricing.Amount = 50m;
        command.Data.Pricing.Currency = "EUR";
        command.Data.Pricing.DurationDays = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Pricing.DurationDays", ValidationMessages.ConditionalRequired.ErrorCode, MessageContains: "Duration Days is required when FlatRate pricing type.")
        );
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreateBjjEvent_Pricing_TypeFlatRate_DurationDaysNotPositive_ShouldReturnBadRequest(int invalidDuration) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = PricingType.FlatRate;
        command.Data.Pricing.Amount = 50m;
        command.Data.Pricing.Currency = "EUR";
        command.Data.Pricing.DurationDays = invalidDuration;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Pricing.DurationDays", "MUST_BE_POSITIVE_FLAT_RATE_DURATION", MessageContains: "Duration Days must be greater than 0.")
        );
    }

    [Theory]
    [InlineData(PricingType.PerSession)]
    [InlineData(PricingType.PerDay)]
    public async Task CreateBjjEvent_Pricing_PerSessionOrDay_DurationDaysNull_ShouldPass(PricingType perType) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = perType;
        command.Data.Pricing.Amount = 20m;
        command.Data.Pricing.Currency = "EUR";
        command.Data.Pricing.DurationDays = null;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Theory]
    [InlineData(PricingType.PerSession, 1)]
    [InlineData(PricingType.PerDay, 5)]
    public async Task CreateBjjEvent_Pricing_PerSessionOrDay_DurationDaysPositive_ShouldPass(PricingType perType, int validDuration) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = perType;
        command.Data.Pricing.Amount = 20m;
        command.Data.Pricing.Currency = "EUR";
        command.Data.Pricing.DurationDays = validDuration;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Theory]
    [InlineData(PricingType.PerSession, 0)]
    [InlineData(PricingType.PerDay, -1)]
    public async Task CreateBjjEvent_Pricing_PerSessionOrDay_DurationDaysNotPositiveIfProvided_ShouldReturnBadRequest(PricingType perType, int invalidDuration) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = perType;
        command.Data.Pricing.Amount = 20m;
        command.Data.Pricing.Currency = "EUR";
        command.Data.Pricing.DurationDays = invalidDuration;

        // Act
        var response = await Http.PostAsJsonAsync("api/bjjevent", command);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Pricing.DurationDays", ValidationMessages.PositiveOrNull.ErrorCode, MessageContains: "Duration Days must be null or positive when provided for PerSession or PerDay pricing.")
      );
    }

    #endregion


}
