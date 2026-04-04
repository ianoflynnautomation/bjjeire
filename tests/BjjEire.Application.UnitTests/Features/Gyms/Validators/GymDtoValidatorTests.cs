// Tests for GymDtoValidator and its nested validators.
// Uses real validator instances (no mocking) to verify FluentValidation rules
// for all fields including nested validators (affiliation, trialOffer, socialMedia, location).

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Validators;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Application.Features.Gyms.Validators;
using BjjEire.Core.Data;

using FluentValidation;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.Gyms.Validators;

[Trait("Category", "Gym")]
[Trait("Category", "Unit")]
public sealed class GymDtoValidatorTests
{
    private readonly GymDtoValidator _validator;

    public GymDtoValidatorTests()
    {
        var geoValidator = new GeoCoordinatesDtoValidator();
        var locationValidator = new LocationDtoValidator(geoValidator);
        var socialMediaValidator = new SocialMediaDtoValidator();
        var affiliationValidator = new AffiliationDtoValidator();
        var trialOfferValidator = new TrialOfferDtoValidator();

        _validator = new GymDtoValidator(socialMediaValidator, locationValidator, (IValidator<AffiliationDto?>)(object)affiliationValidator, trialOfferValidator);
    }

    private static GymDto ValidDto() => GymTestDataFactory.GetValidGymDto();

    // ─── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_ValidDto_PassesWithNoErrors()
    {
        var result = await _validator.ValidateAsync(ValidDto());

        result.IsValid.ShouldBeTrue();
        result.Errors.ShouldBeEmpty();
    }

    // ─── Name ─────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Validate_BlankName_FailsWithRequiredError(string name)
    {
        var dto = ValidDto();
        dto.Name = name;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Name" && e.ErrorCode == "FIELD_REQUIRED");
    }

    [Fact]
    public async Task Validate_NameExceeds100Chars_FailsWithMaxLengthError()
    {
        var dto = ValidDto();
        dto.Name = new string('a', 101);

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Name" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Fact]
    public async Task Validate_NameAtMaxLength_Passes()
    {
        var dto = ValidDto();
        dto.Name = new string('a', 100);

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    // ─── Description ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_DescriptionExceeds200Chars_FailsWithMaxLengthError()
    {
        var dto = ValidDto();
        dto.Description = new string('a', 201);

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Description" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Fact]
    public async Task Validate_NullDescription_Passes()
    {
        var dto = ValidDto();
        dto.Description = null;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    // ─── Affiliation (optional) ────────────────────────────────────────────────

    [Fact]
    public async Task Validate_NullAffiliation_Passes()
    {
        var dto = ValidDto();
        dto.Affiliation = null;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public async Task Validate_AffiliationNameExceeds100Chars_FailsWithMaxLengthError()
    {
        var dto = ValidDto();
        dto.Affiliation = new AffiliationDto { Name = new string('a', 101) };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Name") && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Theory]
    [InlineData("invalid-url")]
    [InlineData("www.missing-scheme.com")]
    [InlineData("http:/missing-slash.com")]
    public async Task Validate_AffiliationInvalidWebsiteUrl_FailsWithUrlError(string invalidUrl)
    {
        var dto = ValidDto();
        dto.Affiliation = new AffiliationDto { Name = "Test", Website = invalidUrl };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Website") && e.ErrorCode == "INVALID_URL");
    }

    // ─── TrialOffer ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_NullTrialOffer_FailsWithNotNullError()
    {
        var dto = ValidDto();
        dto.TrialOffer = null!;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "TrialOffer" && e.ErrorCode == "NOT_NULL");
    }

    [Fact]
    public async Task Validate_TrialOfferAvailableWithNoFreeClassesOrDays_FailsConditionalRequired()
    {
        var dto = ValidDto();
        dto.TrialOffer = new TrialOfferDto { IsAvailable = true, FreeClasses = null, FreeDays = null };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "TrialOffer" && e.ErrorCode == "CONDITIONAL_FIELD_REQUIRED");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(11)]
    public async Task Validate_FreeClassesOutOfRange_FailsWithInclusiveBetweenError(int value)
    {
        var dto = ValidDto();
        dto.TrialOffer = new TrialOfferDto { IsAvailable = true, FreeClasses = value };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "TrialOffer.FreeClasses" && e.ErrorCode == "INCLUSIVE_BETWEEN_VALUE");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(31)]
    public async Task Validate_FreeDaysOutOfRange_FailsWithInclusiveBetweenError(int value)
    {
        var dto = ValidDto();
        dto.TrialOffer = new TrialOfferDto { IsAvailable = true, FreeDays = value };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "TrialOffer.FreeDays" && e.ErrorCode == "INCLUSIVE_BETWEEN_VALUE");
    }

    [Fact]
    public async Task Validate_TrialOfferNotesTooLong_FailsWithMaxLengthError()
    {
        var dto = ValidDto();
        dto.TrialOffer = new TrialOfferDto { IsAvailable = false, Notes = new string('a', 201) };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "TrialOffer.Notes" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Fact]
    public async Task Validate_TrialOfferNotAvailableWithValidFreeClasses_Passes()
    {
        var dto = ValidDto();
        dto.TrialOffer = new TrialOfferDto { IsAvailable = false, FreeClasses = 3 };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    // ─── SocialMedia ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_NullSocialMedia_FailsWithNotNullError()
    {
        var dto = ValidDto();
        dto.SocialMedia = null!;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "SocialMedia" && e.ErrorCode == "NOT_NULL");
    }

    [Theory]
    [InlineData("invalid-fb-url")]
    [InlineData("www.facebook.com/missing-scheme")]
    public async Task Validate_SocialMediaInvalidFacebookUrl_FailsWithUrlError(string invalidUrl)
    {
        var dto = ValidDto();
        dto.SocialMedia = new SocialMediaDto { Facebook = invalidUrl };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Facebook") && e.ErrorCode == "INVALID_URL");
    }

    [Fact]
    public async Task Validate_SocialMediaAllEmptyUrls_Passes()
    {
        var dto = ValidDto();
        dto.SocialMedia = new SocialMediaDto
        {
            Facebook = string.Empty,
            Instagram = string.Empty,
            X = string.Empty,
            YouTube = string.Empty
        };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    // ─── Location ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_NullLocation_FailsWithNotNullError()
    {
        var dto = ValidDto();
        dto.Location = null!;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location" && e.ErrorCode == "NOT_NULL");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Validate_LocationAddressBlank_FailsWithRequiredError(string address)
    {
        var dto = ValidDto();
        dto.Location.Address = address;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Address" && e.ErrorCode == "FIELD_REQUIRED");
    }

    [Fact]
    public async Task Validate_LocationAddressExceeds100Chars_FailsWithMaxLengthError()
    {
        var dto = ValidDto();
        dto.Location.Address = new string('a', 101);

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Address" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Validate_LocationVenueBlank_FailsWithRequiredError(string venue)
    {
        var dto = ValidDto();
        dto.Location.Venue = venue;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Venue" && e.ErrorCode == "FIELD_REQUIRED");
    }

    [Fact]
    public async Task Validate_LocationVenueExceeds100Chars_FailsWithMaxLengthError()
    {
        var dto = ValidDto();
        dto.Location.Venue = new string('a', 101);

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Venue" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Fact]
    public async Task Validate_LocationCoordinatesNull_FailsWithNotNullError()
    {
        var dto = ValidDto();
        dto.Location.Coordinates = null!;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Coordinates" && e.ErrorCode == "NOT_NULL");
    }

    // ─── GeoCoordinates ───────────────────────────────────────────────────────

    [Theory]
    [InlineData(-90.1)]
    [InlineData(90.1)]
    public async Task Validate_LatitudeOutOfRange_FailsWithInclusiveBetweenError(double latitude)
    {
        var dto = ValidDto();
        dto.Location.Coordinates.Coordinates = [dto.Location.Coordinates.Coordinates[0], latitude];

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Coordinates.Latitude" && e.ErrorCode == "INCLUSIVE_BETWEEN_VALUE");
    }

    [Theory]
    [InlineData(-180.1)]
    [InlineData(180.1)]
    public async Task Validate_LongitudeOutOfRange_FailsWithInclusiveBetweenError(double longitude)
    {
        var dto = ValidDto();
        dto.Location.Coordinates.Coordinates = [longitude, dto.Location.Coordinates.Coordinates[1]];

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Coordinates.Longitude" && e.ErrorCode == "INCLUSIVE_BETWEEN_VALUE");
    }

    [Fact]
    public async Task Validate_PlaceNameExceeds100Chars_FailsWithMaxLengthError()
    {
        var dto = ValidDto();
        dto.Location.Coordinates.PlaceName = new string('a', 101);

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Coordinates.PlaceName" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Fact]
    public async Task Validate_PlaceIdExceeds24Chars_FailsWithMaxLengthError()
    {
        var dto = ValidDto();
        dto.Location.Coordinates.PlaceId = new string('a', 25);

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Coordinates.PlaceId" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    // ─── Optional URL fields ───────────────────────────────────────────────────

    [Theory]
    [InlineData("invalid-url")]
    [InlineData("http:/missing-slash.com")]
    public async Task Validate_InvalidWebsiteUrl_FailsWithUrlError(string invalidUrl)
    {
        var dto = ValidDto();
        dto.Website = invalidUrl;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Website" && e.ErrorCode == "INVALID_URL");
    }

    [Theory]
    [InlineData("invalid-url")]
    [InlineData("www.no-scheme.com")]
    public async Task Validate_InvalidTimetableUrl_FailsWithUrlError(string invalidUrl)
    {
        var dto = ValidDto();
        dto.TimetableUrl = invalidUrl;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "TimetableUrl" && e.ErrorCode == "INVALID_URL");
    }

    [Theory]
    [InlineData("invalid-url")]
    [InlineData("htp://typo-scheme.com")]
    public async Task Validate_InvalidImageUrl_FailsWithUrlError(string invalidUrl)
    {
        var dto = ValidDto();
        dto.ImageUrl = invalidUrl;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "ImageUrl" && e.ErrorCode == "INVALID_URL");
    }

    [Fact]
    public async Task Validate_AllOptionalUrlsNull_Passes()
    {
        var dto = ValidDto();
        dto.Website = null;
        dto.TimetableUrl = null;
        dto.ImageUrl = null;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }
}
