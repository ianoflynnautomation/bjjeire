using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Commands;

public sealed record UpdateBjjEventCommand : IRequest<BjjEventDto> {
    public required BjjEventDto Model { get; set; }
}
