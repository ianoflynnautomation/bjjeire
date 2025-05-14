
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.BjjEvents.Validators;

public class BjjEventScheduleDtoValidator : AbstractValidator<BjjEventScheduleDto> {
    public BjjEventScheduleDtoValidator() {
        _ = RuleFor(x => x.ScheduleType)
        .ApplyEnumValidator("Schedule Type");

        _ = When(x => x.ScheduleType == ScheduleType.FixedDate, () => {
            _ = RuleFor(x => x.StartDate)
                     .NotNull()
                     .WithName("Start date")
                     .WithMessage(ValidationMessages.ConditionalRequired.Message("Start date", "schedule type is FixedDate"))
                     .WithErrorCode(ValidationMessages.ConditionalRequired.ErrorCode);

            _ = RuleFor(x => x.EndDate)
                .NotNull()
                .WithName("End date")
                .WithMessage(ValidationMessages.ConditionalRequired.Message("End date", "schedule type is FixedDate"))
                .WithErrorCode(ValidationMessages.ConditionalRequired.ErrorCode);

            _ = RuleFor(x => x.EndDate)
                       .GreaterThanOrEqualTo(x => x.StartDate)
                       .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
                       .WithMessage(ValidationMessages.GreaterThanOrEqual.Message("End date", "start date"))
                       .WithErrorCode(ValidationMessages.GreaterThanOrEqual.ErrorCode);
        });

        _ = When(x => x.ScheduleType == ScheduleType.Recurring && x.StartDate.HasValue && x.EndDate.HasValue, () 
        => _ = RuleFor(x => x.EndDate)
                .GreaterThanOrEqualTo(x => x.StartDate)
                .WithMessage(ValidationMessages.GreaterThanOrEqual.Message("End date", "start date"))
                .WithErrorCode(ValidationMessages.GreaterThanOrEqual.ErrorCode));

        _ = RuleFor(x => x.Hours)
            .NotNull()
            .WithMessage(ValidationMessages.NotNull.Message("Hours"))
            .WithErrorCode(ValidationMessages.NotNull.ErrorCode)
            .Must(hours => hours == null || hours.All(h => h != null))
            .WithMessage(ValidationMessages.NoNullEntries.Message("Hours"))
            .WithErrorCode(ValidationMessages.NoNullEntries.ErrorCode);


        _ = RuleForEach(x => x.Hours).SetValidator(new BjjEventHoursDtoValidator());
    }

}
