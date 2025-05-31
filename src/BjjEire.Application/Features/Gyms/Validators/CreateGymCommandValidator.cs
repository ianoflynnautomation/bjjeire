// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Features.Gyms.Commands;
using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Common.Validators;

public class CreateGymCommandValidator : AbstractValidator<CreateGymCommand>
{
    public CreateGymCommandValidator(IValidator<GymDto> gymDtoValidator)
    {
        RuleFor(x => x.Data)
            .NotNull()
            .WithMessage("Gym model is required.").WithErrorCode("NotNullValidator")
            .SetValidator(gymDtoValidator);
    }
}
