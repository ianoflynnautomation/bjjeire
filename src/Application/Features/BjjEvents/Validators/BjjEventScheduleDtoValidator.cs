
using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Features.BjjEvents.DTOs;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class BjjEventScheduleDtoValidator : AbstractValidator<BjjEventScheduleDto>
{
    public BjjEventScheduleDtoValidator()
    {
        RuleFor(x => x.ScheduleType)
        .ApplyEnumValidator("Schedule Type");

        When(x => x.ScheduleType == ScheduleType.FixedDate, () =>
        {
            RuleFor(x => x.StartDate)
                     .NotNull()
                     .WithName("Start date")
                     .WithMessage(ValidationMessages.ConditionalRequired.Message("Start date", "schedule type is FixedDate"))
                     .WithErrorCode(ValidationMessages.ConditionalRequired.ErrorCode);

            RuleFor(x => x.EndDate)
                .NotNull()
                .WithName("End date")
                .WithMessage(ValidationMessages.ConditionalRequired.Message("End date", "schedule type is FixedDate"))
                .WithErrorCode(ValidationMessages.ConditionalRequired.ErrorCode);

            RuleFor(x => x.EndDate)
                       .GreaterThanOrEqualTo(x => x.StartDate)
                       .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
                       .WithMessage(ValidationMessages.GreaterThanOrEqual.Message("End date", "start date"))
                       .WithErrorCode(ValidationMessages.GreaterThanOrEqual.ErrorCode);
        });

        When(x => x.ScheduleType == ScheduleType.Recurring && x.StartDate.HasValue && x.EndDate.HasValue, () =>
        {
            RuleFor(x => x.EndDate)
                .GreaterThanOrEqualTo(x => x.StartDate)
                .WithMessage(ValidationMessages.GreaterThanOrEqual.Message("End date", "start date"))
                .WithErrorCode(ValidationMessages.GreaterThanOrEqual.ErrorCode);
        });

        RuleFor(x => x.Hours)
            .NotNull()
            .WithMessage(ValidationMessages.NotNull.Message("Hours"))
            .WithErrorCode(ValidationMessages.NotNull.ErrorCode)
            .Must(hours => hours == null || hours.All(h => h != null))
            .WithMessage(ValidationMessages.NoNullEntries.Message("Hours"))
            .WithErrorCode(ValidationMessages.NoNullEntries.ErrorCode);



        RuleForEach(x => x.Hours).SetValidator(new BjjEventHoursDtoValidator());
    }

}
