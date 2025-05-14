
using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed record CreateBjjEventCommand : IRequest<BjjEventDto> {
    public required BjjEventDto Model { get; set; }
}


