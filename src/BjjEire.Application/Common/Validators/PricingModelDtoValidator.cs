// BjjEire.Application.Common.Validators.PricingModelDtoValidator
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Common.Validators;

public class PricingModelDtoValidator : AbstractValidator<PricingModelDto>
{
    public PricingModelDtoValidator()
    {
        _ = RuleFor(x => x.Type)
            .ApplyEnumValidator("Pricing Type");

        _ = When(x => x.Type == PricingType.Free, () =>
        {
            _ = RuleFor(x => x.Amount)
                .Equal(0m)
                .WithName("Amount")
                .WithMessage(ValidationMessages.MustBeSpecificValueWhen.Message("0", "Pricing Type is Free"))
                .WithErrorCode("MUST_BE_ZERO_WHEN_FREE");

            _ = RuleFor(x => x.Currency!)
                .ApplyMustBeNullValidator("Currency", "Pricing Type is Free");

            _ = RuleFor(x => x.DurationDays)
                .ApplyMustBeNullValidator("Duration Days", "Pricing Type is Free");
        });

        _ = When(x => x.Type != PricingType.Free, () =>
        {
            _ = RuleFor(x => x.Amount)
                .GreaterThan(0m)
                .WithName("Amount")
                .WithMessage(ValidationMessages.GreaterThan.Message("0"))
                .WithErrorCode("MUST_BE_POSITIVE_FOR_PAID");

            _ = RuleFor(x => x.Currency!)
                .ApplyRequiredValidator("Currency")
                .ApplyMustBeInSetValidator("Currency", ValidCurrencies, "ISO 4217 currency code (e.g., EUR, USD)");
        });

        _ = When(x => x.Type == PricingType.FlatRate, () =>
        {
            _ = RuleFor(x => x.DurationDays)
                .ApplyConditionalRequiredValidator("Duration Days", "FlatRate pricing type");

            _ = RuleFor(x => x.DurationDays)
                .GreaterThan(0)
                .When(dto => dto.DurationDays.HasValue)
                .WithName("Duration Days")
                .WithMessage(ValidationMessages.GreaterThan.Message("0"))
                .WithErrorCode("MUST_BE_POSITIVE_FLAT_RATE_DURATION");
        });

        _ = When(x => x.Type is PricingType.PerSession or PricingType.PerDay, () => _ = RuleFor(x => x.DurationDays)
                .ApplyPositiveOrNullValidator("Duration Days", "provided for PerSession or PerDay pricing"));
    }

    private static readonly HashSet<string> ValidCurrencies = new()
    {
        "EUR", "USD", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "BRL"
    };
}
