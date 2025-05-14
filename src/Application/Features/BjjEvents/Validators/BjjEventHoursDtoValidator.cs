using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class BjjEventHoursDtoValidator : AbstractValidator<BjjEventHoursDto> {
    public BjjEventHoursDtoValidator() {
        _ = RuleFor(x => x.Day)
            .ApplyEnumValidator("Day");

        _ = RuleFor(x => x.CloseTime)
            .ApplyGreaterThanValidator(x => x.OpenTime, "Close Time", "OpenTime");
    }
}