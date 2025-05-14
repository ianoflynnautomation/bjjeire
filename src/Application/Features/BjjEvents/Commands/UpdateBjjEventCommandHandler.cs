using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;


namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed class UpdateBjjEventCommandHandler(IBjjEventService bjjEventService, IMapper mapper) : IRequestHandler<UpdateBjjEventCommand, BjjEventDto> {
    private readonly IBjjEventService _bjjEventService = bjjEventService;
    private readonly IMapper _mapper = mapper;

    public async Task<BjjEventDto> Handle(UpdateBjjEventCommand request, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(request);
        var gymEntity = await _bjjEventService.GetById(request.Model.Id);
        gymEntity = _mapper.Map<BjjEvent>(gymEntity);
        await _bjjEventService.Update(gymEntity);
        var resultDto = _mapper.Map<BjjEventDto>(gymEntity);
        return resultDto;
    }
}
