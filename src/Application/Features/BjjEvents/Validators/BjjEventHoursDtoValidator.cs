using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class BjjEventHoursDtoValidator : AbstractValidator<BjjEventHoursDto>
{
    public BjjEventHoursDtoValidator()
    {
        RuleFor(oh => oh.Day)
            .IsInEnum().WithMessage("A valid {PropertyName} must be specified.");

        RuleFor(oh => oh.CloseTime)
            .GreaterThan(oh => oh.OpenTime)
            .WithMessage("{PropertyName} must be later than OpenTime for same-day closing.");
    }
}