// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.Gyms.Commands;
using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Features.Gyms.Validators;

public class CreateGymCommandValidator : AbstractValidator<CreateGymCommand>
{
    public CreateGymCommandValidator(IValidator<GymDto> gymDtoValidator)
    {
        _ = RuleFor(x => x.Data)
            .ApplyNotNullValidator("Data")
            .SetValidator(gymDtoValidator);

    }
}
