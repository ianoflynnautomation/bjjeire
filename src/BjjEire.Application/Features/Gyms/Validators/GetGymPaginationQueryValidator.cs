// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Features.Gyms.Queries;

namespace BjjEire.Application.Features.Gyms.Validators;

public class GetGymPaginationQueryValidator : AbstractValidator<GetGymPaginationQuery>
{
    public GetGymPaginationQueryValidator()
    {
        _ = RuleFor(x => x.County)
            .IsInEnum()
            .When(x => x.County.HasValue)
            .WithMessage("The provided county is not valid.");

    }
}
