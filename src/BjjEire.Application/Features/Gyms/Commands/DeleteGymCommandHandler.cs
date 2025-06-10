using Ardalis.GuardClauses;
using BjjEire.Application.Common.Interfaces;

namespace BjjEire.Application.Features.Gyms.Commands;

public sealed class DeleteGymCommandHandler(IGymService gymService) : IRequestHandler<DeleteGymCommand, DeleteGymResponse> {
    private readonly IGymService _gymService = gymService;
    public async Task<DeleteGymResponse> Handle(DeleteGymCommand request, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(request);
        var gymEntity = await _gymService.GetByIdAsync(request.Id);

        _ = Guard.Against.NotFound(request.Id, gymEntity);

        await _gymService.DeleteAsync(gymEntity);
        return new DeleteGymResponse() { IsSuccess = true };
    }
}
