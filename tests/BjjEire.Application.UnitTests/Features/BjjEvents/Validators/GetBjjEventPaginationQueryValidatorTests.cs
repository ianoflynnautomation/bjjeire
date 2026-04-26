// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

// Tests for GetBjjEventPaginationQueryValidator.
// Verifies: no filters passes, valid enum filters pass,
// out-of-range enum values fail.

using BjjEire.Application.Features.BjjEvents.Queries;
using BjjEire.Application.Features.BjjEvents.Validators;
using BjjEire.Domain.Enums;

using FluentValidation.Results;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Validators;

[Trait("Feature", "BjjEvents")]
[Trait("Category", "Unit")]
public sealed class GetBjjEventPaginationQueryValidatorTests
{
    private readonly GetBjjEventPaginationQueryValidator _validator = new();

    [Fact]
    public async Task Validate_NoFilters_Passes()
    {
        GetBjjEventPaginationQuery query = new();

        ValidationResult result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }

    [Theory]
    [InlineData(County.Dublin)]
    [InlineData(County.Cork)]
    [InlineData(County.Galway)]
    [InlineData(County.None)]
    public async Task Validate_ValidCounty_Passes(County county)
    {
        GetBjjEventPaginationQuery query = new()
        { County = county };

        ValidationResult result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }

    [Theory]
    [InlineData(BjjEventType.Seminar)]
    [InlineData(BjjEventType.Camp)]
    [InlineData(BjjEventType.OpenMat)]
    public async Task Validate_ValidType_Passes(BjjEventType type)
    {
        GetBjjEventPaginationQuery query = new()
        { Type = type };

        ValidationResult result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public async Task Validate_InvalidCountyValue_FailsValidation()
    {
        GetBjjEventPaginationQuery query = new()
        { County = (County)999 };

        ValidationResult result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "County");
    }

    [Fact]
    public async Task Validate_InvalidTypeValue_FailsValidation()
    {
        GetBjjEventPaginationQuery query = new()
        { Type = (BjjEventType)999 };

        ValidationResult result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == "Type");
    }

    [Fact]
    public async Task Validate_BothValidFilters_Passes()
    {
        GetBjjEventPaginationQuery query = new()
        {
            County = County.Dublin,
            Type = BjjEventType.Seminar,
            Page = 2,
            PageSize = 50
        };

        ValidationResult result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public async Task Validate_NullableFiltersNotProvided_Passes()
    {
        GetBjjEventPaginationQuery query = new()
        { County = null, Type = null };

        ValidationResult result = await _validator.ValidateAsync(query);

        result.IsValid.ShouldBeTrue();
    }
}
