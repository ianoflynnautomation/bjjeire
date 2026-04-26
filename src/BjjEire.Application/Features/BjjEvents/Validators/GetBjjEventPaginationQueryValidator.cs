// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


using BjjEire.Application.Features.BjjEvents.Queries;

namespace BjjEire.Application.Features.BjjEvents.Validators;

public class GetBjjEventPaginationQueryValidator : AbstractValidator<GetBjjEventPaginationQuery>
{
    public GetBjjEventPaginationQueryValidator()
    {
        _ = RuleFor(x => x.County)
            .IsInEnum()
            .When(x => x.County.HasValue)
            .WithMessage("The provided County is not valid.");

        _ = RuleFor(x => x.Type)
           .IsInEnum()
           .When(x => x.Type.HasValue)
           .WithMessage("The provided Type is not valid.");
    }
}
