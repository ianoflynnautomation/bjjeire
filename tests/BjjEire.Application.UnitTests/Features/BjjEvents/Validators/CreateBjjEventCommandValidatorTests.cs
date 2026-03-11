
using BjjEire.Application.Common.Validators;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.Validators;
using BjjEire.Application.UnitTests.Common.TestBuilders;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Validators;

public sealed class CreateBjjEventCommandValidatorTests
{
    private readonly CreateBjjEventCommandValidator _validator;

    public CreateBjjEventCommandValidatorTests()
    {
        var geoValidator = new GeoCoordinatesDtoValidator();
        var locationValidator = new LocationDtoValidator(geoValidator);
        var socialMediaValidator = new SocialMediaDtoValidator();
        var organizerValidator = new OrganizerDtoValidator();
        var scheduleValidator = new BjjEventScheduleDtoValidator();
        var pricingValidator = new PricingModelDtoValidator();
        var dtoValidator = new BjjEventDtoValidator(
            organizerValidator, socialMediaValidator,
            scheduleValidator, pricingValidator, locationValidator);

        _validator = new CreateBjjEventCommandValidator(dtoValidator);
    }

    [Fact]
    public async Task Validate_ValidCommand_PassesWithNoErrors()
    {
        var command = BjjEventTestData.ValidCreateCommand();

        var result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeTrue();
        result.Errors.ShouldBeEmpty();
    }

    [Fact]
    public async Task Validate_NullData_FailsWithNotNullError()
    {
        var command = new CreateBjjEventCommand { Data = null! };

        var result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Data" && e.ErrorCode == "NOT_NULL");
    }

    [Fact]
    public async Task Validate_DataWithMissingName_FailsDelegatedToDataValidator()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Name = "";
        var command = new CreateBjjEventCommand { Data = dto };

        var result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Data.Name");
    }

    [Fact]
    public async Task Validate_DataWithInvalidSchedule_FailsDelegatedToDataValidator()
    {
        var dto = BjjEventTestData.ValidDto();
        dto.Schedule.Hours = [];   // empty hours → validation failure

        var command = new CreateBjjEventCommand { Data = dto };

        var result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldNotBeEmpty();
    }
}
