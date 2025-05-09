
using BjjWorld.Application.Common.Extentions;
using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class BjjEventDtoValidator : AbstractValidator<BjjEventDto>
{
    public BjjEventDtoValidator(IValidator<ContactDto> contactDtoValidator, IValidator<BjjEventScheduleDto> bjjEventScheduleDtoValidator)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Event name is required.")
            .MaximumLength(100).WithMessage("Event name cannot exceed 100 characters.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid event type.");

        RuleFor(x => x.EventUrl)
            .Must(ValtionExtention.BeAValidUrl).When(x => !string.IsNullOrEmpty(x.EventUrl))
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
}