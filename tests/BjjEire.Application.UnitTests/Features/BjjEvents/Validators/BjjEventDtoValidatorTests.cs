// Tests for BjjEventDtoValidator.
// Uses real validator instances (no mocking) to verify FluentValidation rules
// for all fields including nested validators (organiser, schedule, pricing, location).

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Validators;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Application.Features.BjjEvents.Validators;
using BjjEire.Domain.Enums;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Validators;

[Trait("Category", "BjjEvent")]
[Trait("Category", "Unit")]
public sealed class BjjEventDtoValidatorTests
{
    private readonly BjjEventDtoValidator _validator;

    public BjjEventDtoValidatorTests()
    {
        var geoValidator = new GeoCoordinatesDtoValidator();
        var locationValidator = new LocationDtoValidator(geoValidator);
        var socialMediaValidator = new SocialMediaDtoValidator();
        var organizerValidator = new OrganizerDtoValidator();
        var scheduleValidator = new BjjEventScheduleDtoValidator();
        var pricingValidator = new PricingModelDtoValidator();

        _validator = new BjjEventDtoValidator(
            organizerValidator,
            socialMediaValidator,
            scheduleValidator,
            pricingValidator,
            locationValidator);
    }

    // ─── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_ValidDto_PassesWithNoErrors()
    {
        var result = await _validator.ValidateAsync(BjjEventTestData.ValidDto());

        result.IsValid.ShouldBeTrue();
        result.Errors.ShouldBeEmpty();
    }

    // ─── Id ───────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("not-an-objectid")]
    [InlineData("12345")]
    [InlineData("ZZZZZZZZZZZZZZZZZZZZZZZZ")]
    public async Task Validate_InvalidId_FailsWithIdFormatError(string badId)
    {
        var dto = BjjEventTestData.ValidDto(badId);

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Id");
    }

    // ─── Name ─────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Validate_BlankName_FailsWithRequiredError(string name)
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Name = name;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Name");
    }

    [Fact]
    public async Task Validate_NameExceeds100Chars_FailsWithMaxLengthError()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Name = new string('A', 101);

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Name" && e.ErrorCode == "MAX_LENGTH_EXCEEDED");
    }

    [Fact]
    public async Task Validate_NameAtMaxLength_Passes()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Name = new string('A', 100);

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    // ─── Organiser ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_NullOrganiser_FailsWithNotNullError()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Organiser = null!;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Organiser" && e.ErrorCode == "NOT_NULL");
    }

    [Fact]
    public async Task Validate_OrganiserWithEmptyName_FailsWithRequiredError()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Organiser = new OrganizerDto { Name = "", Website = "" };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Name"));
    }

    [Fact]
    public async Task Validate_OrganiserWithInvalidWebsite_FailsWithUrlError()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Organiser = new OrganizerDto { Name = "Club", Website = "not-a-url" };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Website") && e.ErrorCode == "INVALID_URL");
    }

    // ─── EventUrl / ImageUrl ──────────────────────────────────────────────────

    [Theory]
    [InlineData("ftp://not-http.com")]
    [InlineData("just-plain-text")]
    [InlineData("http:/missing-slash.com")]
    public async Task Validate_InvalidEventUrl_FailsWithUrlError(string badUrl)
    {
        var dto = BjjEventTestData.ValidDto();
        dto.EventUrl = badUrl;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "EventUrl" && e.ErrorCode == "INVALID_URL");
    }

    [Fact]
    public async Task Validate_EmptyEventUrl_Passes()
    {
        // Empty string is treated as "no URL provided" — allowed.
        var dto = BjjEventTestData.ValidDto();
        dto.EventUrl = "";

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    // ─── Schedule ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_NullSchedule_FailsWithNotNullError()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Schedule = null!;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Schedule" && e.ErrorCode == "NOT_NULL");
    }

    [Fact]
    public async Task Validate_EndDateBeforeStartDate_FailsWithGreaterThanOrEqualError()
    {
        var dto = BjjEventTestData.ValidDto();
        var now = DateTime.UtcNow;
        dto.Schedule = new BjjEventScheduleDto
        {
            StartDate = now.AddDays(5),
            EndDate = now.AddDays(1),   // before start
            Hours =
            [
                new BjjEventHoursDto
                {
                    Day = DayOfWeek.Saturday,
                    OpenTime = TimeSpan.FromHours(10),
                    CloseTime = TimeSpan.FromHours(18)
                }
            ]
        };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Schedule.EndDate" && e.ErrorCode == "GREATER_THAN_OR_EQUAL");
    }

    [Fact]
    public async Task Validate_ScheduleWithNullHours_FailsWithNotNullError()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Schedule = new BjjEventScheduleDto
        {
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(2),
            Hours = null
        };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Hours"));
    }

    [Fact]
    public async Task Validate_ScheduleWithEmptyHours_FailsWithRequiredError()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Schedule.Hours = [];

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Hours"));
    }

    [Fact]
    public async Task Validate_HoursWithCloseTimeLessThanOpenTime_FailsWithGreaterThanError()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Schedule.Hours =
        [
            new BjjEventHoursDto
            {
                Day = DayOfWeek.Monday,
                OpenTime = TimeSpan.FromHours(18),
                CloseTime = TimeSpan.FromHours(10)   // before open
            }
        ];

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("CloseTime") && e.ErrorCode == "GREATER_THAN");
    }

    // ─── Pricing ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_FreePricingWithNonZeroAmount_FailsValidation()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Pricing = new PricingModelDto
        {
            Type = PricingType.Free,
            Amount = 10m,           // must be 0 when Free
            Currency = null,
            DurationDays = null
        };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Pricing.Amount" && e.ErrorCode == "MUST_BE_ZERO_WHEN_FREE");
    }

    [Fact]
    public async Task Validate_PaidPricingWithZeroAmount_FailsValidation()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Pricing = new PricingModelDto
        {
            Type = PricingType.FlatRate,
            Amount = 0m,           // must be > 0 for paid
            Currency = "EUR",
            DurationDays = 30
        };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Pricing.Amount" && e.ErrorCode == "MUST_BE_POSITIVE_FOR_PAID");
    }

    [Fact]
    public async Task Validate_FlatRatePricingWithMissingDurationDays_FailsValidation()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Pricing = new PricingModelDto
        {
            Type = PricingType.FlatRate,
            Amount = 50m,
            Currency = "EUR",
            DurationDays = null    // required for FlatRate
        };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("DurationDays") && e.ErrorCode == "CONDITIONAL_FIELD_REQUIRED");
    }

    [Fact]
    public async Task Validate_PaidPricingWithInvalidCurrency_FailsValidation()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Pricing = new PricingModelDto
        {
            Type = PricingType.PerSession,
            Amount = 20m,
            Currency = "XYZ",      // not a valid ISO 4217 code in the allowed set
            DurationDays = null
        };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Currency") && e.ErrorCode == "INVALID_FORMAT");
    }

    [Fact]
    public async Task Validate_ValidFlatRatePricing_Passes()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Pricing = new PricingModelDto
        {
            Type = PricingType.FlatRate,
            Amount = 50m,
            Currency = "EUR",
            DurationDays = 30
        };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }

    // ─── Location ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_NullLocation_FailsWithNotNullError()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Location = null!;

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Location" && e.ErrorCode == "NOT_NULL");
    }

    [Fact]
    public async Task Validate_LocationWithLatitudeOutOfRange_FailsValidation()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Location.Coordinates.Latitude = 91.0;   // > 90

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Latitude"));
    }

    // ─── SocialMedia ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Validate_SocialMediaWithInvalidInstagramUrl_FailsWithUrlError()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.SocialMedia = new SocialMediaDto { Instagram = "not-a-url" };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName.Contains("Instagram") && e.ErrorCode == "INVALID_URL");
    }

    [Fact]
    public async Task Validate_SocialMediaWithAllValidUrls_Passes()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.SocialMedia = new SocialMediaDto
        {
            Instagram = "https://instagram.com/club",
            Facebook = "https://facebook.com/club",
            X = "https://x.com/club",
            YouTube = "https://youtube.com/club"
        };

        var result = await _validator.ValidateAsync(dto);

        result.IsValid.ShouldBeTrue();
    }
}
