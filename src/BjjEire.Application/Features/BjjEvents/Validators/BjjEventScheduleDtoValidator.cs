
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.BjjEvents.Validators;

public class BjjEventScheduleDtoValidator : AbstractValidator<BjjEventScheduleDto>
{
  public BjjEventScheduleDtoValidator()
  {
    _ = RuleFor(x => x.ScheduleType)
        .ApplyEnumValidator("Schedule Type");

    _ = When(x => x.ScheduleType == ScheduleType.FixedDate, () =>
    {
      _ = RuleFor(x => x.StartDate)
              .ApplyConditionalRequiredValidator("Start Date", "schedule type is FixedDate");

      _ = RuleFor(x => x.EndDate)
              .ApplyConditionalRequiredValidator("End Date", "schedule type is FixedDate");

      _ = RuleFor(x => x.EndDate)
              .ApplyGreaterThanOrEqualValidator(x => x.StartDate, "End Date", "Start Date")
              .When(x => x.StartDate.HasValue && x.EndDate.HasValue);

      _ = RuleFor(x => x.Hours!)
              .ApplyNotNullValidator("Event Hours")
              .DependentRules(() =>
              {
              _ = RuleFor(x => x.Hours)
                      .NotEmpty()
                      .WithMessage(ValidationMessages.Required.Message)
                      .WithErrorCode(ValidationMessages.Required.ErrorCode);
            });
    });

    _ = When(x => x.ScheduleType == ScheduleType.Recurring, () =>
    {
      _ = RuleFor(x => x.EndDate)
              .ApplyGreaterThanOrEqualValidator(x => x.StartDate, "End Date", "Start Date")
              .When(x => x.StartDate.HasValue && x.EndDate.HasValue);

      _ = RuleFor(x => x.Hours!)
              .ApplyNotNullValidator("Event Hours")
              .DependentRules(() =>
              {
              _ = RuleFor(x => x.Hours)
                      .NotEmpty()
                      .WithMessage(ValidationMessages.Required.Message)
                      .WithErrorCode(ValidationMessages.Required.ErrorCode);
            });
    });

    _ = RuleFor(x => x.Hours!)
        .ApplyNoNullEntriesValidator<BjjEventScheduleDto, List<BjjEventHoursDto>, BjjEventHoursDto>("Event Hours");

    _ = RuleForEach(x => x.Hours)
        .SetValidator(new BjjEventHoursDtoValidator());
  }
}
