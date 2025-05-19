using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed record UpdateBjjEventCommand : IRequest<UpdateBjjEventResponse>
{
    public required BjjEventDto Model { get; set; }
}
