
using BjjWorld.Application.Common.DTOs;
using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class BjjEventDtoValidator : AbstractValidator<BjjEventDto>
{
    public BjjEventDtoValidator(IValidator<OrganizerDto> organizerDtoValidator,
                                IValidator<SocialMediaDto> socialMediaDtoValidator,
                                IValidator<BjjEventScheduleDto> bjjEventScheduleDtoValidator,
                                IValidator<BjjEventPricingModelDto> pricingModelDtoValidator,
                                IValidator<LocationDto> locationDtoValidator)
    {
        RuleFor(x => x.Name)
          .ApplyRequiredString("Event name", 100);

        RuleFor(x => x.Description)
            .MaximumLength(100)
             .WithMessage(ValidationMessages.MaxLength.Message("Description", 500))
            .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);

        RuleFor(x => x.Type)
            .ApplyEnumValidator("Event type");

        RuleFor(x => x.Organiser)
            .ApplyNotNullValidator("Event organiser")
            .SetValidator(organizerDtoValidator);

        RuleFor(x => x.Status)
           .ApplyEnumValidator("Event staus");

        RuleFor(x => x.StatusReason)
            .MaximumLength(100)
            .WithName("Status Reason")
                .WithMessage(ValidationMessages.MaxLength.Message("Status reason", 500))
                .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);

        RuleFor(x => x.SocialMedia)
          .ApplyNotNullValidator("Social Media")
            .SetValidator(socialMediaDtoValidator);

        RuleFor(x => x.Region)
            .ApplyRequiredString("Address", 100);

        RuleFor(x => x.City)
            .ApplyRequiredString("City", 100);

        RuleFor(x => x.Location)
            .ApplyNotNullValidator("Location")
            .SetValidator(locationDtoValidator);

        RuleFor(x => x.Schedule)
            .ApplyNotNullValidator("Schedule")
            .SetValidator(bjjEventScheduleDtoValidator);

        RuleFor(x => x.Pricing)
            .ApplyNotNullValidator("Pricing")
            .SetValidator(pricingModelDtoValidator);

        RuleFor(x => x.EventUrl)
            .ApplyUrlValidator("Event URL");

        RuleFor(x => x.ImageUrl)
            .ApplyUrlValidator("Image URL");
    }
}