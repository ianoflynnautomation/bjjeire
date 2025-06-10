
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Features.Gyms.Validators;

public class AffiliationDtoValidator : AbstractValidator<AffiliationDto> {
    public AffiliationDtoValidator() {
        _ = RuleFor(x => x.Name)
            .ApplyMaxLengthValidator("Name", 100);

        _ = RuleFor(x => x.Website!)
            .ApplyUrlValidator("Website")
            .When(x => !string.IsNullOrEmpty(x.Website));
    }
}
