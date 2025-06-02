
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Features.Gyms.Validators;

public class TrialOfferDtoValidator : AbstractValidator<TrialOfferDto>
{
  public TrialOfferDtoValidator()
  {
    _ = When(dto => dto.IsAvailable, () =>
    {
      _ = RuleFor(x => x)
              .Must(x => x.FreeClasses.HasValue || x.FreeDays.HasValue)
              .WithMessage(ValidationMessages.ConditionalRequired.Message("Trial Offer", "IsAvailable is true"))
              .WithErrorCode(ValidationMessages.ConditionalRequired.ErrorCode);

      _ = RuleFor(x => x.FreeClasses)
              .ApplyPositiveOrNullValidator("Free Classes", "provided")
               .ApplyInclusiveBetweenValidator("Free Classes", 1, 10)
              .When(x => x.FreeClasses.HasValue);

      _ = RuleFor(x => x.FreeDays)
              .ApplyPositiveOrNullValidator("Free Days", "provided")
              .ApplyInclusiveBetweenValidator("Free Days", 1, 30)
              .When(x => x.FreeDays.HasValue);
    });

    _ = RuleFor(x => x.FreeClasses)
        .InclusiveBetween(1, 10)
        .When(x => x.FreeClasses.HasValue)
        .WithMessage("FreeClasses must be between 1 and 10 when provided.");

    _ = RuleFor(x => x.FreeDays)
        .InclusiveBetween(1, 30)
        .When(x => x.FreeDays.HasValue)
        .WithMessage("FreeDays must be between 1 and 30 when provided.");

    _ = RuleFor(x => x.Notes!)
        .ApplyMaxLengthValidator("Notes", 200)
        .When(x => !string.IsNullOrEmpty(x.Notes));

  }
}
