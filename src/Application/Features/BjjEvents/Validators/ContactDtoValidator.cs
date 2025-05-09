
using BjjWorld.Application.Common.Extentions;
using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

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
            .Must(ValtionExtention.BeAValidUrl).WithMessage("Website must be a valid URL (e.g., https://example.com).");
    }

}