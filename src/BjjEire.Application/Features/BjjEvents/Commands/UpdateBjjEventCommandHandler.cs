using Ardalis.GuardClauses;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed class UpdateBjjEventCommandHandler(IBjjEventService bjjEventService, IMapper mapper) : IRequestHandler<UpdateBjjEventCommand, UpdateBjjEventResponse>
{
    private readonly IBjjEventService _bjjEventService = bjjEventService;
    private readonly IMapper _mapper = mapper;

    public async Task<UpdateBjjEventResponse> Handle(UpdateBjjEventCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var bjjEventEntity = await _bjjEventService.GetById(request.Model.Id);

        _ = Guard.Against.NotFound(request.Model!.Id, bjjEventEntity);

        bjjEventEntity = _mapper.Map<BjjEvent>(bjjEventEntity);
        await _bjjEventService.Update(bjjEventEntity);
        var resultDto = _mapper.Map<BjjEventDto>(bjjEventEntity);

        return new UpdateBjjEventResponse() { Model = resultDto };
    }
}
