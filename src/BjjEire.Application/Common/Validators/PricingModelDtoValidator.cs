
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Common.Validators;

public class PricingModelDtoValidator : AbstractValidator<BjjEventPricingModelDto>
{
    public PricingModelDtoValidator()
    {
        _ = RuleFor(x => x.Type)
              .ApplyEnumValidator("Pricing Type");

        _ = RuleFor(x => x.Amount)
            .ApplyNonNegativeValidator("Amount");

        _ = RuleFor(x => x.DurationDays)
            .ApplyPositiveOrNullValidator("Duration Days", "PerSession or PerDay pricing")
            .When(x => x.Type is PricingType.PerSession or PricingType.PerDay);

        _ = When(x => x.Type == PricingType.FlatRate, () => RuleFor(x => x.DurationDays)
                .NotNull()
                    .WithName("Duration Days")
                    .WithMessage(ValidationMessages.ConditionalRequired.Message("Duration days", "FlatRate pricing type"))
                    .WithErrorCode(ValidationMessages.ConditionalRequired.ErrorCode)
                .GreaterThan(0)
                    .WithMessage(ValidationMessages.GreaterThan.Message("Duration days", "zero"))
                    .WithErrorCode(ValidationMessages.GreaterThan.ErrorCode));

        _ = RuleFor(x => x.Currency)
            .ApplyRequiredValidator("Currency")
            .ApplyMustBeInSetValidator("Currency", ValidCurrencies, "valid ISO 4217 currency code (e.g., EUR, USD)");

        _ = When(x => x.Type == PricingType.Free, () =>
        {
            _ = RuleFor(x => x.Amount)
                .Null()
                .WithMessage(ValidationMessages.MustBeNull.Message("Amount", "pricing type is Free"))
                .WithErrorCode(ValidationMessages.MustBeNull.ErrorCode);

            _ = RuleFor(x => x.Currency)
                .ApplyMustBeNullValidator("Currency", "free events");

            _ = RuleFor(x => x.DurationDays)
                .ApplyMustBeNullValidator("Duration Days", "free events");
        });

    }

    private static readonly HashSet<string> ValidCurrencies =
    [
        "EUR", "USD", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "BRL"
    ];

}