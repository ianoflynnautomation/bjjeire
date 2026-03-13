// Tests for GetGymPaginationQueryValidator.
// Verifies: no filter passes, valid County enum passes,
// null County passes, out-of-range County value fails.

using BjjEire.Application.Features.Gyms.Queries;
using BjjEire.Application.Features.Gyms.Validators;
using BjjEire.Domain.Enums;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.Gyms.Validators;

[Trait("Category", "Gym")]
[Trait("Category", "Unit")]
public sealed class GetGymPaginationQueryValidatorTests
{
    private readonly GetGymPaginationQueryValidator _validator = new();

    [Fact]
    public async Task Validate_NoFilters_Passes()
    {
        var query = new GetGymPaginationQuery();

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
        var query = new GetGymPaginationQuery { County = county };

        var result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public async Task Validate_NullCounty_Passes()
    {
        var query = new GetGymPaginationQuery { County = null };

        var result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public async Task Validate_InvalidCountyValue_FailsValidation()
    {
        var query = new GetGymPaginationQuery { County = (County)999 };

        var result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "County");
    }

    [Fact]
    public async Task Validate_PaginationDefaultsApplied_Passes()
    {
        // BasePaginationQuery silently clamps invalid page/pageSize to defaults,
        // so the validator never sees invalid values — verify no errors.
        var query = new GetGymPaginationQuery { Page = 2, PageSize = 50 };

        var result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }
}
