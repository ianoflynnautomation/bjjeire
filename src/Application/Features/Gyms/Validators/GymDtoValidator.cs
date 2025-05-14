using BjjWorld.Application.Common.DTOs;
using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Features.Gyms.DTOs;

namespace BjjWorld.Application.Features.Gyms.Validators;

public class GymDtoValidator : AbstractValidator<GymDto> {
    public GymDtoValidator(IValidator<SocialMediaDto> socialMediaDtoValidator,
                                IValidator<LocationDto> locationDtoValidator,
                                IValidator<TrialOfferDto> trialOfferDtoValidator) {
        _ = RuleFor(x => x.Name)
            .ApplyRequiredString("Gym name", 100);

        _ = RuleFor(x => x.Description)
            .MaximumLength(100)
             .WithMessage(ValidationMessages.MaxLength.Message("Description", 500))
            .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);

        _ = RuleFor(x => x.Status)
        .ApplyEnumValidator("Gym status");

        _ = RuleFor(x => x.County)
        .ApplyRequiredString("County", 100);

        // RuleFor(x => x.Affiliation)
        //   .ApplyNotNullValidator("Affiliation")
        //     .SetValidator(affiliationDtoValidator);

        _ = RuleFor(x => x.TrialOffer)
         .ApplyNotNullValidator("TrialOffer")
           .SetValidator(trialOfferDtoValidator);

        _ = RuleFor(x => x.SocialMedia)
          .ApplyNotNullValidator("Social Media")
            .SetValidator(socialMediaDtoValidator);

        _ = RuleFor(x => x.Location)
        .ApplyNotNullValidator("Location")
        .SetValidator(locationDtoValidator);


        _ = RuleFor(x => x.Website)
            .Must(ValidationExtension.IsValidUrl)
            .When(x => !string.IsNullOrEmpty(x.Website))
            .WithMessage("{PropertyName} must be a valid URL.");

        _ = RuleFor(x => x.TimetableUrl)
            .Must(ValidationExtension.IsValidUrl)
            .When(x => !string.IsNullOrEmpty(x.TimetableUrl))
            .WithMessage("{PropertyName} must be a valid URL.");


        _ = RuleFor(x => x.ImageUrl)
            .Must(ValidationExtension.IsValidUrl)
            .When(x => !string.IsNullOrEmpty(x.ImageUrl))
            .WithMessage("{PropertyName} must be a valid URL.");
    }
}