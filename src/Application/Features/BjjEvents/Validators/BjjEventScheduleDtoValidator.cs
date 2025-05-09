
using BjjWorld.Application.Features.BjjEvents.DTOs;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class BjjEventScheduleDtoValidator : AbstractValidator<BjjEventScheduleDto>
{
    public BjjEventScheduleDtoValidator()
    {
        RuleFor(x => x.ScheduleType)
            .IsInEnum()
            .WithMessage("ScheduleType must be either Recurring or FixedDate.");

        // For FixedDate, StartDate and EndDate are required
        When(x => x.ScheduleType == ScheduleType.FixedDate, () =>
        {
            RuleFor(x => x.StartDate)
                .NotNull()
                .WithMessage("StartDate is required for FixedDate schedules.");

            RuleFor(x => x.EndDate)
                .NotNull()
                .WithMessage("EndDate is required for FixedDate schedules.");

            RuleFor(x => x.EndDate)
                .GreaterThanOrEqualTo(x => x.StartDate)
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
                .WithMessage("EndDate must be on or after StartDate.");
        });

        // For Recurring, StartDate and EndDate are optional, but EndDate must be >= StartDate if both provided
        When(x => x.ScheduleType == ScheduleType.Recurring && x.StartDate.HasValue && x.EndDate.HasValue, () =>
        {
            RuleFor(x => x.EndDate)
                .GreaterThanOrEqualTo(x => x.StartDate)
                .WithMessage("EndDate must be on or after StartDate.");
        });

        // Hours validation (can be null or empty)
        RuleFor(x => x.Hours)
            .NotNull()
            .WithMessage("Hours cannot be null (use an empty list for no hours).")
            .Must(hours => hours == null || hours.All(h => h != null))
            .WithMessage("Hours list cannot contain null entries.");

        // Nested validation for each BjjEventHoursDto
        RuleForEach(x => x.Hours).SetValidator(new BjjEventHoursDtoValidator());
    }

}
