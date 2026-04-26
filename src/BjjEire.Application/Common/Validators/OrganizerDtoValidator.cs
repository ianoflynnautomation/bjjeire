// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Common.Validators;

public class OrganizerDtoValidator : AbstractValidator<OrganizerDto>
{
    public OrganizerDtoValidator()
    {
        _ = RuleFor(x => x.Name)
            .ApplyRequiredString("Name", 100);

        _ = RuleFor(x => x.Website)
             .ApplyUrlValidator("Website");
    }
}
