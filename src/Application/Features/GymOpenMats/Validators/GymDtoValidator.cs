
using BjjWorld.Application.Features.GymOpenMats.DTOs;

namespace BjjWorld.Application.Features.GymOpenMats.Validators;

public class GymDtoValidator : AbstractValidator<GymDto>
{
    public GymDtoValidator(IValidator<GymOpeningHoursDto> openingHoursDtoValidator,
                           IValidator<GymLocationDto> locationDtoValidator,
                           IValidator<ContactDto> contactDtoValidator)
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(150).WithMessage("{PropertyName} must not exceed 150 characters.");

        RuleFor(x => x.Description)
               .MaximumLength(2000).WithMessage("{PropertyName} must not exceed 2000 characters.");

        RuleForEach(g => g.OpeningHours)
            .SetValidator(openingHoursDtoValidator);

        RuleFor(g => g.Address)
               .NotNull().WithMessage("{PropertyName} cannot be null.")
               .SetValidator(locationDtoValidator);

        RuleFor(g => g.Contact)
               .SetValidator(contactDtoValidator);

    }
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

    private bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return false;

        // Try to create a Uri object and check scheme
        return Uri.TryCreate(url, UriKind.Absolute, out Uri? uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }

    public class LocationDtoValidator : AbstractValidator<GymLocationDto>
    {
        public LocationDtoValidator()
        {
            RuleFor(l => l.Address)
                .MaximumLength(250).WithMessage("{PropertyName} must not exceed 250 characters.");

            RuleFor(l => l.City)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");

            RuleFor(l => l.Country)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");

            RuleFor(l => l.PostalCode)
                .MaximumLength(20).WithMessage("{PropertyName} must not exceed 20 characters.")
                .When(l => !string.IsNullOrEmpty(l.PostalCode));
        }
    }


    public class OpeningHoursDtoValidator : AbstractValidator<GymOpeningHoursDto>
    {
        public OpeningHoursDtoValidator()
        {
            RuleFor(oh => oh.Day)
                .IsInEnum().WithMessage("A valid {PropertyName} must be specified.");

            RuleFor(oh => oh.CloseTime)
                .GreaterThan(oh => oh.OpenTime)
                .WithMessage("{PropertyName} must be later than OpenTime for same-day closing.");
        }
    }

}