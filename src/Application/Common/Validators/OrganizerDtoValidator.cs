using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Common.Validators;

public class OrganizerDtoValidator : AbstractValidator<OrganizerDto> {
    public OrganizerDtoValidator() {
        _ = RuleFor(x => x.Name)
            .ApplyRequiredString("Orgaizer name", 100);

        _ = RuleFor(x => x.Website)
             .ApplyUrlValidator("Orgaizer Website");
    }
}