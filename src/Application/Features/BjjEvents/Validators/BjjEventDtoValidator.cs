
using BjjWorld.Application.Common.DTOs;
using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class BjjEventDtoValidator : AbstractValidator<BjjEventDto>
{
    public BjjEventDtoValidator(IValidator<ContactDto> contactDtoValidator,
                                IValidator<BjjEventScheduleDto> bjjEventScheduleDtoValidator,
                                IValidator<BjjEventPricingModelDto> pricingModelDtoValidator)
    {
        RuleFor(x => x.Name)
          .ApplyRequiredString("Event name", 100);

        RuleFor(x => x.Type)
            .ApplyEnumValidator("Event type");

        RuleFor(x => x.EventUrl)
            .ApplyUrlValidator("Event URL");

        RuleFor(x => x.StatusReason)
            .NotEmpty()
                .When(x => !x.IsActive)
                .WithName("Status Reason")
                .WithMessage(ValidationMessages.ConditionalRequired.Message("Status reason", "event is inactive"))
                .WithErrorCode(ValidationMessages.ConditionalRequired.ErrorCode)
            .MaximumLength(500)
                .When(x => !string.IsNullOrEmpty(x.StatusReason))
                .WithMessage(ValidationMessages.MaxLength.Message("Status reason", 500))
                .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);

        RuleFor(x => x.Address)
            .ApplyRequiredString("Address", 200);

        RuleFor(x => x.City)
            .ApplyRequiredString("City", 100);

        RuleFor(x => x.Schedule)
            .ApplyNotNullValidator("Schedule")
            .SetValidator(bjjEventScheduleDtoValidator);

        RuleFor(x => x.Contact)
            .ApplyNotNullValidator("Contact")
            .SetValidator(contactDtoValidator);

        RuleFor(x => x.Pricing)
            .ApplyNotNullValidator("Pricing")
            .SetValidator(pricingModelDtoValidator);
    }
}