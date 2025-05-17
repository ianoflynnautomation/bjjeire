

using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed class CreateBjjEventCommandHandler(IBjjEventService bjjEventService, IMapper mapper)
    : IRequestHandler<CreateBjjEventCommand, CreateBjjEventResponse> {
    private readonly IBjjEventService _bjjEventService = bjjEventService;
    private readonly IMapper _mapper = mapper;

    public async Task<CreateBjjEventResponse> Handle(CreateBjjEventCommand request, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(request);
        var bjjEventEntity = _mapper.Map<BjjEvent>(request.Model);
        await _bjjEventService.Insert(bjjEventEntity);
        var resultDto = _mapper.Map<BjjEventDto>(bjjEventEntity);
        return new CreateBjjEventResponse() { Model = resultDto };
    }
}
