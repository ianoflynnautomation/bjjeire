using BjjEire.Application.Common.Interfaces;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed class DeleteBjjEventCommandHandler(IBjjEventService bjjEventService) : IRequestHandler<DeleteBjjEventCommand, bool> {
    private readonly IBjjEventService _bjjEventService = bjjEventService;
    public async Task<bool> Handle(DeleteBjjEventCommand request, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(request);
        var gymEntity = await _bjjEventService.GetById(request.Model.Id) ??
        throw new ArgumentException("No gym found with the specified id");
        await _bjjEventService.Delete(gymEntity);
        return true;
    }
}