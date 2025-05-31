
using BjjEire.Application.Common.DTOs;

namespace BjjEire.Application.Common.Validators;

public class SocialMediaDtoValidator : AbstractValidator<SocialMediaDto>
{
    public SocialMediaDtoValidator()
    {
        _ =RuleFor(x => x.Facebook)
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrEmpty(x.Facebook));

        _ =RuleFor(x => x.Instagram)
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrEmpty(x.Instagram));

        _ =RuleFor(x => x.X)
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrEmpty(x.X));

        _ =RuleFor(x => x.YouTube)
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrEmpty(x.YouTube));
    }

}
