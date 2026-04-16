
using BjjEire.Application.Common.Validators;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Application.Features.BjjEvents.Validators;

using FluentValidation.Results;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Validators;

[Trait("Feature", "BjjEvents")]
[Trait("Category", "Unit")]
public sealed class CreateBjjEventCommandValidatorTests
{
    private readonly CreateBjjEventCommandValidator _validator;

    public CreateBjjEventCommandValidatorTests()
    {
        GeoCoordinatesDtoValidator geoValidator = new();
        LocationDtoValidator locationValidator = new(geoValidator);
        SocialMediaDtoValidator socialMediaValidator = new();
        OrganizerDtoValidator organizerValidator = new();
        BjjEventScheduleDtoValidator scheduleValidator = new();
        PricingModelDtoValidator pricingValidator = new();
        BjjEventDtoValidator dtoValidator = new(
            organizerValidator, socialMediaValidator,
            scheduleValidator, pricingValidator, locationValidator);

        _validator = new CreateBjjEventCommandValidator(dtoValidator);
    }

    [Fact]
    public async Task Validate_ValidCommand_PassesWithNoErrors()
    {
        CreateBjjEventCommand command = BjjEventTestData.ValidCreateCommand();

        ValidationResult result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeTrue();
        result.Errors.ShouldBeEmpty();
    }

    [Fact]
    public async Task Validate_NullData_FailsWithNotNullError()
    {
        CreateBjjEventCommand command = new()
        { Data = null! };

        ValidationResult result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Data" && e.ErrorCode == "NOT_NULL");
    }

    [Fact]
    public async Task Validate_DataWithMissingName_FailsDelegatedToDataValidator()
    {
        BjjEventDto dto = BjjEventTestData.ValidDto();
        dto.Name = "";
        CreateBjjEventCommand command = new()
        { Data = dto };

        ValidationResult result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Data.Name");
    }

    [Fact]
    public async Task Validate_DataWithInvalidSchedule_FailsDelegatedToDataValidator()
    {
        BjjEventDto dto = BjjEventTestData.ValidDto();
        dto.Schedule.Hours = [];   // empty hours → validation failure

        CreateBjjEventCommand command = new()
        { Data = dto };

        ValidationResult result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldNotBeEmpty();
    }
}
