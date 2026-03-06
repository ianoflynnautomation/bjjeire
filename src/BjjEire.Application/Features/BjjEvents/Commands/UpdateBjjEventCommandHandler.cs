using BjjEire.Application.Common.Exceptions;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed class UpdateBjjEventCommandHandler(IBjjEventService bjjEventService, IMapper mapper)
    : IRequestHandler<UpdateBjjEventCommand, UpdateBjjEventResponse> {

    public async Task<UpdateBjjEventResponse> Handle(UpdateBjjEventCommand request, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(request);

        var bjjEventEntity = await bjjEventService.GetByIdAsync(request.Data.Id)
            ?? throw new NotFoundException(nameof(BjjEvent), request.Data.Id);

        mapper.Map(request.Data, bjjEventEntity);
        await bjjEventService.UpdateAsync(bjjEventEntity);
        var resultDto = mapper.Map<BjjEventDto>(bjjEventEntity);

        return new UpdateBjjEventResponse { Data = resultDto };
    }
}
