using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.Validators;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Validators;

[Trait("Category", "BjjEvent")]
[Trait("Category", "Unit")]
public sealed class DeleteBjjEventCommandValidatorTests
{
    private readonly DeleteBjjEventCommandValidator _validator = new();

    [Fact]
    public async Task Validate_ValidObjectId_Passes()
    {
        var command = new DeleteBjjEventCommand { Id = ObjectIds.Valid1 };

        var result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public async Task Validate_EmptyId_FailsWithRequiredMessage()
    {
        var command = new DeleteBjjEventCommand { Id = "" };

        var result = await _validator.ValidateAsync(command);

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
        var command = new DeleteBjjEventCommand { Id = invalidId };

        var result = await _validator.ValidateAsync(command);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e =>
            e.PropertyName == "Id" &&
            e.ErrorMessage == "The provided ID is not in a valid format.");
    }
}
