using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class OrganizerDtoValidator : AbstractValidator<OrganizerDto>
{
    public OrganizerDtoValidator()
    {
        RuleFor(x => x.Name)
            .ApplyRequiredString("Orgaizer name", 100);

        RuleFor(x => x.Website)
             .ApplyUrlValidator("Orgaizer Website");
    }
}