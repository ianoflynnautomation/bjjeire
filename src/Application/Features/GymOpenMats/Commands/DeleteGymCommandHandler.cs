using BjjWorld.Application.Common.Interfaces;

namespace BjjWorld.Application.Features.GymOpenMats.Commands;

public sealed class DeleteGymCommandHandler(IGymService openMatService) : IRequestHandler<DeleteGymCommand, bool>
{
    private readonly IGymService _openMatService = openMatService;

    public async Task<bool> Handle(DeleteGymCommand request, CancellationToken cancellationToken)
    {
        var gymEntity = await _openMatService.GetById(request.Model.Id) ??
        throw new ArgumentException("No gym found with the specified id");
        await _openMatService.Delete(gymEntity);
        return true;
    }
}