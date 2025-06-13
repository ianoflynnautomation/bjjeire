using BjjEire.Application.Features.Gyms.Commands;
using MongoDB.Bson;

namespace BjjEire.Application.Features.Gyms.Validators;

public class DeleteGymCommandValidator : AbstractValidator<DeleteGymCommand> {
    public DeleteGymCommandValidator() {
        _ = RuleFor(v => v.Id)
            .NotEmpty().WithMessage("ID is required.")
            .Must(id => ObjectId.TryParse(id, out _))
            .WithMessage("The provided ID is not in a valid format.");
    }
}
