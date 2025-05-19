
using BjjEire.Application.Common.Extensions;
using BjjEire.Domain.Entities.Common;

namespace BjjEire.Application.Common.Validators;

public class SocialMediaDtoValidator : AbstractValidator<SocialMedia>
{
    public SocialMediaDtoValidator()
    {
        // RuleFor(x => x.Facebook);
        // When(x => x != null, () => RuleFor(x => x.Facebook).ApplyUrlValidator("Facebook URL"));

        // RuleFor(x => x.Instagram);
        // When(x => x != null, () => RuleFor(x => x.Instagram).ApplyUrlValidator("Instagram URL"));

        // RuleFor(x => x.X);
        // When(x => x != null, () => RuleFor(x => x.X).ApplyUrlValidator("X URL"));

        // RuleFor(x => x.YouTube);
        // When(x => x != null, () => RuleFor(x => x.YouTube).ApplyUrlValidator("YouTube URL"));

    }
}