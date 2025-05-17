
using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed record CreateBjjEventResponse() {

    public required BjjEventDto Model { get; init; }
}