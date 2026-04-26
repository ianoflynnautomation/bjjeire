// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Features.BjjEvents.Validators;

public class CreateBjjEventCommandValidator : AbstractValidator<CreateBjjEventCommand>
{
    public CreateBjjEventCommandValidator(IValidator<BjjEventDto> bjjEventDtoValidator)
    {
        _ = RuleFor(x => x.Data)
            .ApplyNotNullValidator("Data")
            .SetValidator(bjjEventDtoValidator);

    }
}

