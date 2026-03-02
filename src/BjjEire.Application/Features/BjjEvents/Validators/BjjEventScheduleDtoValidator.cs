
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Features.BjjEvents.Validators;

public class BjjEventScheduleDtoValidator : AbstractValidator<BjjEventScheduleDto> {
    public BjjEventScheduleDtoValidator() {
        _ = RuleFor(x => x.EndDate)
                .ApplyGreaterThanOrEqualValidator(x => x.StartDate, "End Date", "Start Date")
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue);

        _ = RuleFor(x => x.Hours!)
                .ApplyNotNullValidator("Event Hours")
                .DependentRules(() => _ = RuleFor(x => x.Hours)
                      .NotEmpty()
                      .WithMessage(ValidationMessages.Required.Message)
                      .WithErrorCode(ValidationMessages.Required.ErrorCode));

        _ = RuleFor(x => x.Hours!)
            .ApplyNoNullEntriesValidator<BjjEventScheduleDto, List<BjjEventHoursDto>, BjjEventHoursDto>("Event Hours");

        _ = RuleForEach(x => x.Hours)
            .SetValidator(new BjjEventHoursDtoValidator());
    }
}
