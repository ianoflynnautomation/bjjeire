using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Features.BjjEvents.Validators;

public class UpdateBjjjEventCommandValidator : AbstractValidator<UpdateBjjEventCommand> {
    public UpdateBjjjEventCommandValidator(IValidator<BjjEventDto> bjjEventDtoValidator) {
        _ = RuleFor(x => x.Data)
            .ApplyNotNullValidator("Data")
            .SetValidator(bjjEventDtoValidator);

    }
}
