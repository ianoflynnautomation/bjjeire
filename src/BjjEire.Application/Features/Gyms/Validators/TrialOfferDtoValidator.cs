
using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Features.Gyms.Validators;

public class TrialOfferDtoValidator : AbstractValidator<TrialOfferDto> {
    public TrialOfferDtoValidator() {
        _ = When(dto => dto.IsAvailable, () => {
            _ = RuleFor(dto => dto)
                .Must(dto => dto.FreeClasses.HasValue || dto.FreeDays.HasValue)
                .WithMessage("At least one of FreeClasses or FreeDays must be provided when IsAvailable is true.");

            _ = RuleFor(dto => dto.FreeClasses)
                .GreaterThan(0)
                .When(dto => dto.FreeClasses.HasValue)
                .WithMessage("FreeClasses must be greater than 0 when provided.");

            _ = RuleFor(dto => dto.FreeDays)
                .GreaterThan(0)
                .When(dto => dto.FreeDays.HasValue)
                .WithMessage("FreeDays must be greater than 0 when provided.");
        });

        // Rule: FreeClasses, when provided, should be within a reasonable range (e.g., 1-10)
        _ = RuleFor(dto => dto.FreeClasses)
            .InclusiveBetween(1, 10)
            .When(dto => dto.FreeClasses.HasValue)
            .WithMessage("FreeClasses must be between 1 and 10 when provided.");

        // Rule: FreeDays, when provided, should be within a reasonable range (e.g., 1-30)
        _ = RuleFor(dto => dto.FreeDays)
            .InclusiveBetween(1, 30)
            .When(dto => dto.FreeDays.HasValue)
            .WithMessage("FreeDays must be between 1 and 30 when provided.");

        // Rule: Notes, when provided, should not exceed 500 characters
        _ = RuleFor(dto => dto.Notes)
            .MaximumLength(500)
            .When(dto => !string.IsNullOrEmpty(dto.Notes))
            .WithMessage("Notes must not exceed 500 characters.");

    }
}