
using BjjWorld.Application.Features.BjjEvents.DTOs;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class BjjEventDtoValidator : AbstractValidator<BjjEventDto>
{
    public BjjEventDtoValidator(IValidator<ContactDto> contactDtoValidator,IValidator<BjjEventScheduleDto> bjjEventScheduleDtoValidator )
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Event name is required.")
            .MaximumLength(100).WithMessage("Event name cannot exceed 100 characters.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid event type.");

        RuleFor(x => x.EventUrl)
            .Must(BeAValidUrl).When(x => !string.IsNullOrEmpty(x.EventUrl))
            .WithMessage("Event URL must be a valid URL.");

        RuleFor(x => x.StatusReason)
            .NotEmpty().When(x => !x.IsActive).WithMessage("Status reason is required when event is inactive.")
            .MaximumLength(500).When(x => !string.IsNullOrEmpty(x.StatusReason))
            .WithMessage("Status reason cannot exceed 500 characters.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Address is required.")
            .MaximumLength(200).WithMessage("Address cannot exceed 200 characters.");

        RuleFor(x => x.Schedule)
            .SetValidator(bjjEventScheduleDtoValidator);

        RuleFor(g => g.Contact)
               .SetValidator(contactDtoValidator);
    }


    public class ContactDtoValidator : AbstractValidator<ContactDto>
    {
        public ContactDtoValidator()
        {
            RuleFor(c => c.Phone)
               .NotEmpty().WithMessage("Phone number is required.")
               .Matches(@"^\+?[1-9]\d{1,14}$").WithMessage("Phone number must be a valid format (e.g., +1234567890).")
               .Length(7, 15).WithMessage("Phone number must be between 7 and 15 digits.");


            RuleFor(x => x.Email).EmailAddress().WithMessage("A valid {PropertyName} is required.")
                    .When(c => !string.IsNullOrEmpty(c.Email))
                    .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");

            RuleFor(x => x.Website)
                .NotEmpty().WithMessage("Website is required.")
                .Must(BeAValidUrl).WithMessage("Website must be a valid URL (e.g., https://example.com).");
        }
    }

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


    private static bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return false;

        // Try to create a Uri object and check scheme
        return Uri.TryCreate(url, UriKind.Absolute, out Uri? uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }

public class BjjEventScheduleDtoValidator : AbstractValidator<BjjEventScheduleDto>
{
    public BjjEventScheduleDtoValidator()
    {
        // ScheduleType must be a valid enum value
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

}