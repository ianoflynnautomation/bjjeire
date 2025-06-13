using BjjEire.Application.Common.Exceptions;
using BjjEire.Application.Common.Interfaces;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed class DeleteBjjEventCommandHandler(IBjjEventService bjjEventService) : IRequestHandler<DeleteBjjEventCommand, DeleteBjjEventResponse> {
    private readonly IBjjEventService _bjjEventService = bjjEventService;
    public async Task<DeleteBjjEventResponse> Handle(DeleteBjjEventCommand request, CancellationToken cancellationToken) {

        ArgumentNullException.ThrowIfNull(request);

        var bjjEventEntity = await _bjjEventService.GetByIdAsync(request.Id)
        ?? throw new NotFoundException("BjjEvent", request.Id);

        await _bjjEventService.DeleteAsync(bjjEventEntity);
        return new DeleteBjjEventResponse() { IsSuccess = true };
    }
}
