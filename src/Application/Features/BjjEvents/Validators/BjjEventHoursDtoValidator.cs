using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class BjjEventHoursDtoValidator : AbstractValidator<BjjEventHoursDto>
{
    public BjjEventHoursDtoValidator()
    {
        RuleFor(x => x.Day)
            .ApplyEnumValidator("Day");

        RuleFor(x => x.CloseTime)
            .ApplyGreaterThanValidator(x => x.OpenTime, "Close Time", "OpenTime");
    }
}