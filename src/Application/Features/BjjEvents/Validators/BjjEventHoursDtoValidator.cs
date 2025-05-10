using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class BjjEventHoursDtoValidator : AbstractValidator<BjjEventHoursDto>
{
    public BjjEventHoursDtoValidator()
    {
        RuleFor(oh => oh.Day)
            .ApplyEnumValidator("Day");

        RuleFor(oh => oh.CloseTime)
            .ApplyGreaterThanValidator(oh => oh.OpenTime, "Close Time", "OpenTime");
    }
}