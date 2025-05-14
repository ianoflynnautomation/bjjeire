using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Commands;

public sealed record DeleteBjjEventCommand : IRequest<bool> {
    public required BjjEventDto Model { get; set; }
}

