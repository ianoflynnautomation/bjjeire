using BjjEire.Application.Common.Exceptions;
using BjjEire.Application.Common.Interfaces;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed class DeleteBjjEventCommandHandler(IBjjEventService bjjEventService)
    : IRequestHandler<DeleteBjjEventCommand, DeleteBjjEventResponse>
{

    public async Task<DeleteBjjEventResponse> Handle(DeleteBjjEventCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var bjjEventEntity = await bjjEventService.GetByIdAsync(request.Id)
 ?? throw new NotFoundException("BjjEvent", request.Id);

        await bjjEventService.DeleteAsync(bjjEventEntity);
        return new DeleteBjjEventResponse { IsSuccess = true };
    }
}
