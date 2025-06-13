using BjjEire.Application.Features.BjjEvents.Commands;
using MongoDB.Bson;

namespace BjjEire.Application.Features.BjjEvents.Validators;

public class DeleteBjjEventCommandValidator : AbstractValidator<DeleteBjjEventCommand> {
    public DeleteBjjEventCommandValidator() {
        _ = RuleFor(v => v.Id)
            .NotEmpty().WithMessage("ID is required.")
            .Must(id => ObjectId.TryParse(id, out _))
            .WithMessage("The provided ID is not in a valid format.");
    }
}
