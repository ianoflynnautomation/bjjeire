
using BjjWorld.Application.Common.DTOs;
using BjjWorld.Application.Common.Extensions;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class ContactDtoValidator : AbstractValidator<ContactDto>
{
    public ContactDtoValidator()
    {
        RuleFor(c => c.Phone)
          .NotEmpty()
          .WithMessage(ValidationMessages.Required.Message("Phone number"))
          .WithErrorCode(ValidationMessages.Required.ErrorCode)
          .Matches(@"^\+?[1-9]\d{1,14}$")
          .WithMessage(ValidationMessages.InvalidFormat.Message("Phone number", "format (e.g., +1234567890)"))
          .WithErrorCode(ValidationMessages.InvalidFormat.ErrorCode)
          .Length(7, 15)
          .WithMessage(ValidationMessages.LengthRange.Message("Phone number", 7, 15))
          .WithErrorCode(ValidationMessages.LengthRange.ErrorCode);

        RuleFor(x => x.Email)
            .EmailAddress()
            .When(c => !string.IsNullOrEmpty(c.Email))
            .WithMessage(ValidationMessages.InvalidFormat.Message("Email", "email address"))
            .WithErrorCode(ValidationMessages.InvalidFormat.ErrorCode)
            .MaximumLength(100)
            .WithMessage(ValidationMessages.MaxLength.Message("Email", 100))
            .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);

        RuleFor(x => x.Website)
            .NotEmpty()
            .WithMessage(ValidationMessages.Required.Message("Website"))
            .WithErrorCode(ValidationMessages.Required.ErrorCode)
            .Must(ValidationExtension.IsValidUrl)
            .WithMessage(ValidationMessages.InvalidUrl.Message("Website"))
            .WithErrorCode(ValidationMessages.InvalidUrl.ErrorCode);
    }

}