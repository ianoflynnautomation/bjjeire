using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.Validators;

using FluentValidation.Results;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Validators;

[Trait("Feature", "BjjEvents")]
[Trait("Category", "Unit")]
public sealed class DeleteBjjEventCommandValidatorTests
{
    private readonly DeleteBjjEventCommandValidator _validator = new();

    [Fact]
    public async Task Validate_ValidObjectId_Passes()
    {
        DeleteBjjEventCommand command = new()
        { Id = ObjectIds.Valid1 };

        ValidationResult result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public async Task Validate_EmptyId_FailsWithRequiredMessage()
    {
        DeleteBjjEventCommand command = new()
        { Id = "" };

        ValidationResult result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Id" && e.ErrorMessage == "ID is required.");
    }

    [Theory]
    [InlineData("not-a-valid-id")]
    [InlineData("12345")]
    [InlineData("ZZZZZZZZZZZZZZZZZZZZZZZZ")]
    [InlineData("507f1f77bcf86cd79943901")]  // 23 chars – one short
    public async Task Validate_InvalidObjectIdFormat_FailsWithFormatMessage(string invalidId)
    {
        DeleteBjjEventCommand command = new()
        { Id = invalidId };

        ValidationResult result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e =>
            e.PropertyName == "Id" &&
            e.ErrorMessage == "The provided ID is not in a valid format.");
    }
}
