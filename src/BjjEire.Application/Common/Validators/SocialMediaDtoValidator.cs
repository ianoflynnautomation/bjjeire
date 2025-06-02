
using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Extensions;

namespace BjjEire.Application.Common.Validators;

public class SocialMediaDtoValidator : AbstractValidator<SocialMediaDto>
{
  public SocialMediaDtoValidator()
  {
    _ = RuleFor(x => x.Facebook)
        .ApplyUrlValidator("Facebook")
        .When(x => !string.IsNullOrEmpty(x.Facebook));

    _ = RuleFor(x => x.Instagram)
        .ApplyUrlValidator("Instagram")
        .When(x => !string.IsNullOrEmpty(x.Instagram));

    _ = RuleFor(x => x.X)
        .ApplyUrlValidator("X")
        .When(x => !string.IsNullOrEmpty(x.X));

    _ = RuleFor(x => x.YouTube)
        .ApplyUrlValidator("YouTube")
        .When(x => !string.IsNullOrEmpty(x.YouTube));
  }

}
