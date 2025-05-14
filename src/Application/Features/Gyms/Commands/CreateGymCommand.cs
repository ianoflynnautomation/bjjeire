
using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Features.Gyms.Commands;

public sealed record CreateGymCommand : IRequest<GymDto> {
    public required GymDto Model { get; set; }
}


