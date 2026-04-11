// Tests for GetBjjEventPaginationQueryValidator.
// Verifies: no filters passes, valid enum filters pass,
// out-of-range enum values fail.

using BjjEire.Application.Features.BjjEvents.Queries;
using BjjEire.Application.Features.BjjEvents.Validators;
using BjjEire.Domain.Enums;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Validators;

[Trait("Category", "BjjEvent")]
[Trait("Category", "Unit")]
public sealed class GetBjjEventPaginationQueryValidatorTests
{
    private readonly GetBjjEventPaginationQueryValidator _validator = new();

    [Fact]
    public async Task Validate_NoFilters_Passes()
    {
        var query = new GetBjjEventPaginationQuery();

        var result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }

    [Theory]
    [InlineData(County.Dublin)]
    [InlineData(County.Cork)]
    [InlineData(County.Galway)]
    [InlineData(County.None)]
    public async Task Validate_ValidCounty_Passes(County county)
    {
        var query = new GetBjjEventPaginationQuery { County = county };

        var result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }

    [Theory]
    [InlineData(BjjEventType.Seminar)]
    [InlineData(BjjEventType.Camp)]
    [InlineData(BjjEventType.OpenMat)]
    public async Task Validate_ValidType_Passes(BjjEventType type)
    {
        var query = new GetBjjEventPaginationQuery { Type = type };

        var result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public async Task Validate_InvalidCountyValue_FailsValidation()
    {
        var query = new GetBjjEventPaginationQuery { County = (County)999 };

        var result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "County");
    }

    [Fact]
    public async Task Validate_InvalidTypeValue_FailsValidation()
    {
        var query = new GetBjjEventPaginationQuery { Type = (BjjEventType)999 };

        var result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Type");
    }

    [Fact]
    public async Task Validate_BothValidFilters_Passes()
    {
        var query = new GetBjjEventPaginationQuery
        {
            County = County.Dublin,
            Type = BjjEventType.Seminar,
            Page = 2,
            PageSize = 50
        };

        var result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public async Task Validate_NullableFiltersNotProvided_Passes()
    {
        var query = new GetBjjEventPaginationQuery { County = null, Type = null };

        var result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }
}
