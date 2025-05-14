
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Features.Gyms.Validators;

public class AffiliationDtoValidator : AbstractValidator<AffiliationDto> {
    public AffiliationDtoValidator() {
        _ = RuleFor(x => x.Name)
            .ApplyRequiredString("Gym name", 100);

        _ = RuleFor(x => x.Website)
            .Must(ValidationExtension.IsValidUrl)
            .When(x => !string.IsNullOrEmpty(x.Website))
            .WithMessage("{PropertyName} must be a valid URL.");
    }
}