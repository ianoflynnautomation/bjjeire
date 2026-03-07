using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed class CreateBjjEventCommandHandler(IBjjEventService bjjEventService, IMapper mapper)
    : IRequestHandler<CreateBjjEventCommand, CreateBjjEventResponse>
{

    public async Task<CreateBjjEventResponse> Handle(CreateBjjEventCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var bjjEventEntity = mapper.Map<BjjEvent>(request.Data);
        await bjjEventService.InsertAsync(bjjEventEntity);
        var resultDto = mapper.Map<BjjEventDto>(bjjEventEntity);
        return new CreateBjjEventResponse { Data = resultDto };
    }
}
