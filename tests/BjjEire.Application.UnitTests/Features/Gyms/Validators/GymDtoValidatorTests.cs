// Tests for GymDtoValidator and its nested validators.
// Uses real validator instances (no mocking) to verify FluentValidation rules
// for all fields including nested validators (affiliation, trialOffer, socialMedia, location).

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Validators;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Application.Features.Gyms.Validators;
using BjjEire.Core.Data;

using FluentValidation;
using FluentValidation.Results;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.Gyms.Validators;

[Trait("Feature", "Gyms")]
[Trait("Category", "Unit")]
public sealed class GymDtoValidatorTests
{
    private readonly GymDtoValidator _validator;

    public GymDtoValidatorTests()
    {
        GeoCoordinatesDtoValidator geoValidator = new();
        LocationDtoValidator locationValidator = new(geoValidator);
        SocialMediaDtoValidator socialMediaValidator = new();
        AffiliationDtoValidator affiliationValidator = new();
        TrialOfferDtoValidator trialOfferValidator = new();

        _validator = new GymDtoValidator(socialMediaValidator, locationValidator, (IValidator<AffiliationDto?>)(object)affiliationValidator, trialOfferValidator);
    }

    private static GymDto ValidDto() => GymTestDataFactory.GetValidGymDto();

    // ─── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_ValidDto_PassesWithNoErrors()
    {
        ValidationResult result = await _validator.ValidateAsync(ValidDto());

        result.IsValid.ShouldBeTrue();
        result.Errors.ShouldBeEmpty();
    }

    // ─── Name ─────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Validate_BlankName_FailsWithRequiredError(string name)
    {
        GymDto dto = ValidDto();
        dto.Name = name;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Name" && e.ErrorCode == "FIELD_REQUIRED");
    }

    [Fact]
    public async Task Validate_NameExceeds100Chars_FailsWithMaxLengthError()
    {
        GymDto dto = ValidDto();
        dto.Name = new string('a', 101);

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Name" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Fact]
    public async Task Validate_NameAtMaxLength_Passes()
    {
        GymDto dto = ValidDto();
        dto.Name = new string('a', 100);

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    // ─── Description ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_DescriptionExceeds200Chars_FailsWithMaxLengthError()
    {
        GymDto dto = ValidDto();
        dto.Description = new string('a', 201);

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Description" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Fact]
    public async Task Validate_NullDescription_Passes()
    {
        GymDto dto = ValidDto();
        dto.Description = null;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    // ─── Affiliation (optional) ────────────────────────────────────────────────

    [Fact]
    public async Task Validate_NullAffiliation_Passes()
    {
        GymDto dto = ValidDto();
        dto.Affiliation = null;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public async Task Validate_AffiliationNameExceeds100Chars_FailsWithMaxLengthError()
    {
        GymDto dto = ValidDto();
        dto.Affiliation = new AffiliationDto { Name = new string('a', 101) };

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Name") && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Theory]
    [InlineData("invalid-url")]
    [InlineData("www.missing-scheme.com")]
    [InlineData("http:/missing-slash.com")]
    public async Task Validate_AffiliationInvalidWebsiteUrl_FailsWithUrlError(string invalidUrl)
    {
        GymDto dto = ValidDto();
        dto.Affiliation = new AffiliationDto { Name = "Test", Website = invalidUrl };

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Website") && e.ErrorCode == "INVALID_URL");
    }

    // ─── TrialOffer ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_NullTrialOffer_FailsWithNotNullError()
    {
        GymDto dto = ValidDto();
        dto.TrialOffer = null!;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "TrialOffer" && e.ErrorCode == "NOT_NULL");
    }

    [Fact]
    public async Task Validate_TrialOfferAvailableWithNoFreeClassesOrDays_FailsConditionalRequired()
    {
        GymDto dto = ValidDto();
        dto.TrialOffer = new TrialOfferDto { IsAvailable = true, FreeClasses = null, FreeDays = null };

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "TrialOffer" && e.ErrorCode == "CONDITIONAL_FIELD_REQUIRED");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(11)]
    public async Task Validate_FreeClassesOutOfRange_FailsWithInclusiveBetweenError(int value)
    {
        GymDto dto = ValidDto();
        dto.TrialOffer = new TrialOfferDto { IsAvailable = true, FreeClasses = value };

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "TrialOffer.FreeClasses" && e.ErrorCode == "INCLUSIVE_BETWEEN_VALUE");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(31)]
    public async Task Validate_FreeDaysOutOfRange_FailsWithInclusiveBetweenError(int value)
    {
        GymDto dto = ValidDto();
        dto.TrialOffer = new TrialOfferDto { IsAvailable = true, FreeDays = value };

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "TrialOffer.FreeDays" && e.ErrorCode == "INCLUSIVE_BETWEEN_VALUE");
    }

    [Fact]
    public async Task Validate_TrialOfferNotesTooLong_FailsWithMaxLengthError()
    {
        GymDto dto = ValidDto();
        dto.TrialOffer = new TrialOfferDto { IsAvailable = false, Notes = new string('a', 201) };

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "TrialOffer.Notes" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Fact]
    public async Task Validate_TrialOfferNotAvailableWithValidFreeClasses_Passes()
    {
        GymDto dto = ValidDto();
        dto.TrialOffer = new TrialOfferDto { IsAvailable = false, FreeClasses = 3 };

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    // ─── SocialMedia ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_NullSocialMedia_FailsWithNotNullError()
    {
        GymDto dto = ValidDto();
        dto.SocialMedia = null!;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "SocialMedia" && e.ErrorCode == "NOT_NULL");
    }

    [Theory]
    [InlineData("invalid-fb-url")]
    [InlineData("www.facebook.com/missing-scheme")]
    public async Task Validate_SocialMediaInvalidFacebookUrl_FailsWithUrlError(string invalidUrl)
    {
        GymDto dto = ValidDto();
        dto.SocialMedia = new SocialMediaDto { Facebook = invalidUrl };

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Facebook") && e.ErrorCode == "INVALID_URL");
    }

    [Fact]
    public async Task Validate_SocialMediaAllEmptyUrls_Passes()
    {
        GymDto dto = ValidDto();
        dto.SocialMedia = new SocialMediaDto
        {
            Facebook = string.Empty,
            Instagram = string.Empty,
            X = string.Empty,
            YouTube = string.Empty
        };

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    // ─── Location ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_NullLocation_FailsWithNotNullError()
    {
        GymDto dto = ValidDto();
        dto.Location = null!;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location" && e.ErrorCode == "NOT_NULL");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Validate_LocationAddressBlank_FailsWithRequiredError(string address)
    {
        GymDto dto = ValidDto();
        dto.Location.Address = address;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Address" && e.ErrorCode == "FIELD_REQUIRED");
    }

    [Fact]
    public async Task Validate_LocationAddressExceeds100Chars_FailsWithMaxLengthError()
    {
        GymDto dto = ValidDto();
        dto.Location.Address = new string('a', 101);

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Address" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Validate_LocationVenueBlank_FailsWithRequiredError(string venue)
    {
        GymDto dto = ValidDto();
        dto.Location.Venue = venue;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Venue" && e.ErrorCode == "FIELD_REQUIRED");
    }

    [Fact]
    public async Task Validate_LocationVenueExceeds100Chars_FailsWithMaxLengthError()
    {
        GymDto dto = ValidDto();
        dto.Location.Venue = new string('a', 101);

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Venue" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Fact]
    public async Task Validate_LocationCoordinatesNull_FailsWithNotNullError()
    {
        GymDto dto = ValidDto();
        dto.Location.Coordinates = null!;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Coordinates" && e.ErrorCode == "NOT_NULL");
    }

    // ─── GeoCoordinates ───────────────────────────────────────────────────────

    [Theory]
    [InlineData(-90.1)]
    [InlineData(90.1)]
    public async Task Validate_LatitudeOutOfRange_FailsWithInclusiveBetweenError(double latitude)
    {
        GymDto dto = ValidDto();
        dto.Location.Coordinates.Coordinates = [dto.Location.Coordinates.Coordinates[0], latitude];

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Coordinates.Latitude" && e.ErrorCode == "INCLUSIVE_BETWEEN_VALUE");
    }

    [Theory]
    [InlineData(-180.1)]
    [InlineData(180.1)]
    public async Task Validate_LongitudeOutOfRange_FailsWithInclusiveBetweenError(double longitude)
    {
        GymDto dto = ValidDto();
        dto.Location.Coordinates.Coordinates = [longitude, dto.Location.Coordinates.Coordinates[1]];

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Coordinates.Longitude" && e.ErrorCode == "INCLUSIVE_BETWEEN_VALUE");
    }

    [Fact]
    public async Task Validate_PlaceNameExceeds100Chars_FailsWithMaxLengthError()
    {
        GymDto dto = ValidDto();
        dto.Location.Coordinates.PlaceName = new string('a', 101);

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Coordinates.PlaceName" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Fact]
    public async Task Validate_PlaceIdExceeds24Chars_FailsWithMaxLengthError()
    {
        GymDto dto = ValidDto();
        dto.Location.Coordinates.PlaceId = new string('a', 25);

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location.Coordinates.PlaceId" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    // ─── Optional URL fields ───────────────────────────────────────────────────

    [Theory]
    [InlineData("invalid-url")]
    [InlineData("http:/missing-slash.com")]
    public async Task Validate_InvalidWebsiteUrl_FailsWithUrlError(string invalidUrl)
    {
        GymDto dto = ValidDto();
        dto.Website = invalidUrl;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Website" && e.ErrorCode == "INVALID_URL");
    }

    [Theory]
    [InlineData("invalid-url")]
    [InlineData("www.no-scheme.com")]
    public async Task Validate_InvalidTimetableUrl_FailsWithUrlError(string invalidUrl)
    {
        GymDto dto = ValidDto();
        dto.TimetableUrl = invalidUrl;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "TimetableUrl" && e.ErrorCode == "INVALID_URL");
    }

    [Theory]
    [InlineData("invalid-url")]
    [InlineData("htp://typo-scheme.com")]
    public async Task Validate_InvalidImageUrl_FailsWithUrlError(string invalidUrl)
    {
        GymDto dto = ValidDto();
        dto.ImageUrl = invalidUrl;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "ImageUrl" && e.ErrorCode == "INVALID_URL");
    }

    [Fact]
    public async Task Validate_AllOptionalUrlsNull_Passes()
    {
        GymDto dto = ValidDto();
        dto.Website = null;
        dto.TimetableUrl = null;
        dto.ImageUrl = null;

        ValidationResult result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }
}
