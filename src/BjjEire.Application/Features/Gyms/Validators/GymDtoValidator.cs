using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.Gyms.DTOs;

using MongoDB.Bson;

namespace BjjEire.Application.Features.Gyms.Validators;

public class GymDtoValidator : AbstractValidator<GymDto>
{
    public GymDtoValidator(IValidator<SocialMediaDto> socialMediaDtoValidator,
                                IValidator<LocationDto> locationDtoValidator,
                                IValidator<AffiliationDto?> affiliationDtoValidator,
                                IValidator<TrialOfferDto> trialOfferDtoValidator)
    {

        _ = RuleFor(x => x.Id)
            .Must(id => ObjectId.TryParse(id, out _))
            .WithMessage("The provided ID is not in a valid format.");

        _ = RuleFor(x => x.Name)
            .ApplyRequiredString("Name", 100);

        _ = RuleFor(x => x.Description!)
            .ApplyMaxLengthValidator("Description", 200);

        _ = RuleFor(x => x.Status)
            .ApplyEnumValidator("Status");

        _ = RuleFor(x => x.County)
            .ApplyEnumValidator("County");

        _ = RuleFor(x => x.Affiliation)
             .SetValidator(affiliationDtoValidator);

        _ = RuleFor(x => x.TrialOffer)
            .ApplyNotNullValidator("Trial Offer")
           .SetValidator(trialOfferDtoValidator);

        _ = RuleFor(x => x.SocialMedia)
            .ApplyNotNullValidator("Social Media")
            .SetValidator(socialMediaDtoValidator);

        _ = RuleFor(x => x.Location)
            .ApplyNotNullValidator("Location")
            .SetValidator(locationDtoValidator);

        _ = RuleFor(x => x.Website!)
            .ApplyUrlValidator("Website")
            .When(x => !string.IsNullOrEmpty(x.Website));

        _ = RuleFor(x => x.TimetableUrl!)
            .ApplyUrlValidator("Timetable URL")
            .When(x => !string.IsNullOrEmpty(x.TimetableUrl));

        _ = RuleFor(x => x.ImageUrl!)
            .ApplyUrlValidator("Image URL")
            .When(x => !string.IsNullOrEmpty(x.ImageUrl));
    }
}
