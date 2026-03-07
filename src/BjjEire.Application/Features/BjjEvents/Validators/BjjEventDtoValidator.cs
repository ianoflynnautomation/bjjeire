
using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.BjjEvents.DTOs;

using MongoDB.Bson;

namespace BjjEire.Application.Features.BjjEvents.Validators;

public class BjjEventDtoValidator : AbstractValidator<BjjEventDto>
{
    public BjjEventDtoValidator(IValidator<OrganizerDto> organizerDtoValidator,
                                IValidator<SocialMediaDto> socialMediaDtoValidator,
                                IValidator<BjjEventScheduleDto> bjjEventScheduleDtoValidator,
                                IValidator<PricingModelDto> pricingModelDtoValidator,
                                IValidator<LocationDto> locationDtoValidator)
    {

        _ = RuleFor(x => x.Id)
            .Must(id => ObjectId.TryParse(id, out _))
            .WithMessage("The provided ID is not in a valid format.");

        _ = RuleFor(x => x.Name)
            .ApplyRequiredString("Event Name", 100);

        _ = RuleFor(x => x.Description!)
            .ApplyMaxLengthValidator("Description", 200);

        _ = RuleFor(x => x.Type)
            .ApplyEnumValidator("Event Type");

        _ = RuleFor(x => x.Organiser)
            .ApplyNotNullValidator("Organiser")
            .SetValidator(organizerDtoValidator);

        _ = RuleFor(x => x.Status)
            .ApplyEnumValidator("Event Status");

        _ = RuleFor(x => x.StatusReason!)
            .ApplyMaxLengthValidator("Status Reason", 100);

        _ = RuleFor(x => x.SocialMedia)
            .ApplyNotNullValidator("Social Media")
            .SetValidator(socialMediaDtoValidator);

        _ = RuleFor(x => x.County)
            .ApplyEnumValidator("County");

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
