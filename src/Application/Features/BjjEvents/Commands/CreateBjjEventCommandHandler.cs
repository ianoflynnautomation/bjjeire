

using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Features.BjjEvents.DTOs;
using BjjWorld.Domain.Entities.BjjEvents;

namespace BjjWorld.Application.Features.BjjEvents.Commands;

public sealed class CreateBjjEventCommandHandler(IBjjEventService bjjEventService, IMapper mapper)
    : IRequestHandler<CreateBjjEventCommand, BjjEventDto> {
    private readonly IBjjEventService _bjjEventService = bjjEventService;
    private readonly IMapper _mapper = mapper;

    public async Task<BjjEventDto> Handle(CreateBjjEventCommand request, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(request);
        var gymEntity = _mapper.Map<BjjEvent>(request.Model);
        await _bjjEventService.Insert(gymEntity);
        var resultDto = _mapper.Map<BjjEventDto>(gymEntity);
        return resultDto;
    }
}
