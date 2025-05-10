
using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Features.BjjEvents.DTOs;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class PricingModelDtoValidator : AbstractValidator<BjjEventPricingModelDto>
{
    public PricingModelDtoValidator()
    {
        RuleFor(x => x.Type)
              .ApplyEnumValidator("Pricing Type");

        RuleFor(x => x.Amount)
            .ApplyNonNegativeValidator("Amount");

        RuleFor(x => x.DurationDays)
            .ApplyPositiveOrNullValidator("Duration Days", "PerSession or PerDay pricing")
            .When(x => x.Type == PricingType.PerSession || x.Type == PricingType.PerDay);

        When(x => x.Type == PricingType.FlatRate, () =>
        {
            RuleFor(x => x.DurationDays)
                .NotNull()
                    .WithName("Duration Days")
                    .WithMessage(ValidationMessages.ConditionalRequired.Message("Duration days", "FlatRate pricing type"))
                    .WithErrorCode(ValidationMessages.ConditionalRequired.ErrorCode)
                .GreaterThan(0)
                    .WithMessage(ValidationMessages.GreaterThan.Message("Duration days", "zero"))
                    .WithErrorCode(ValidationMessages.GreaterThan.ErrorCode);
        });

        RuleFor(x => x.Currency)
            .ApplyRequiredValidator("Currency")
            .ApplyMustBeInSetValidator("Currency", ValidCurrencies, "valid ISO 4217 currency code (e.g., EUR, USD)");

        When(x => x.Type == PricingType.Free, () =>
        {
            RuleFor(x => x.Amount)
                .Null()
                .WithMessage(ValidationMessages.MustBeNull.Message("Amount", "pricing type is Free"))
                .WithErrorCode(ValidationMessages.MustBeNull.ErrorCode);

            RuleFor(x => x.Currency)
                .ApplyMustBeNullValidator("Currency", "free events");

            RuleFor(x => x.DurationDays)
                .ApplyMustBeNullValidator("Duration Days", "free events");
        });

    }

    private static readonly HashSet<string> ValidCurrencies =
    [
        "EUR", "USD", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "BRL"
    ];

}