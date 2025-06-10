using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed record UpdateBjjEventResponse() {
    public required BjjEventDto Data { get; set; }
}
