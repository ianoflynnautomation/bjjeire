

using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Features.Gyms.DTOs;

namespace BjjWorld.Application.Features.Gyms.Validators;

public class GymDtoValidator : AbstractValidator<GymDto>
{
    public GymDtoValidator()
    {
        RuleFor(x => x.ImageUrl)
            .Must(ValidationExtension.IsValidUrl)
            .When(x => !string.IsNullOrEmpty(x.ImageUrl))
            .WithMessage("{PropertyName} must be a valid URL.");
    }
}