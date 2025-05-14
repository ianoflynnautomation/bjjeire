
using BjjWorld.Application.Common.DTOs;
using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class BjjEventDtoValidator : AbstractValidator<BjjEventDto> {
    public BjjEventDtoValidator(IValidator<OrganizerDto> organizerDtoValidator,
                                IValidator<SocialMediaDto> socialMediaDtoValidator,
                                IValidator<BjjEventScheduleDto> bjjEventScheduleDtoValidator,
                                IValidator<BjjEventPricingModelDto> pricingModelDtoValidator,
                                IValidator<LocationDto> locationDtoValidator) {
        _ = RuleFor(x => x.Name)
          .ApplyRequiredString("Event name", 100);

        _ = RuleFor(x => x.Description)
            .MaximumLength(100)
             .WithMessage(ValidationMessages.MaxLength.Message("Description", 500))
            .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);

        _ = RuleFor(x => x.Type)
            .ApplyEnumValidator("Event type");

        _ = RuleFor(x => x.Organiser)
            .ApplyNotNullValidator("Event organiser")
            .SetValidator(organizerDtoValidator);

        _ = RuleFor(x => x.Status)
           .ApplyEnumValidator("Event staus");

        _ = RuleFor(x => x.StatusReason)
            .MaximumLength(100)
            .WithName("Status Reason")
                .WithMessage(ValidationMessages.MaxLength.Message("Status reason", 500))
                .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);

        _ = RuleFor(x => x.SocialMedia)
          .ApplyNotNullValidator("Social Media")
            .SetValidator(socialMediaDtoValidator);

        _ = RuleFor(x => x.County)
            .ApplyRequiredString("County", 100);

        _ = RuleFor(x => x.Location)
            .ApplyNotNullValidator("Location")
            .SetValidator(locationDtoValidator);

        _ = RuleFor(x => x.Schedule)
            .ApplyNotNullValidator("Schedule")
            .SetValidator(bjjEventScheduleDtoValidator);

        _ = RuleFor(x => x.Pricing)
            .ApplyNotNullValidator("Pricing")
            .SetValidator(pricingModelDtoValidator);

        _ = RuleFor(x => x.EventUrl)
            .ApplyUrlValidator("Event URL");

        _ = RuleFor(x => x.ImageUrl)
            .ApplyUrlValidator("Image URL");
    }
}