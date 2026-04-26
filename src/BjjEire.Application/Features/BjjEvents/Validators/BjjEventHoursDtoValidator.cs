// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Features.BjjEvents.Validators;

public class BjjEventHoursDtoValidator : AbstractValidator<BjjEventHoursDto>
{
    public BjjEventHoursDtoValidator()
    {
        _ = RuleFor(x => x.Day)
            .ApplyEnumValidator("Day");

        _ = RuleFor(x => x.CloseTime)
            .ApplyGreaterThanValidator(x => x.OpenTime, "Close Time", "Open Time");
    }
}
