
using BjjWorld.Application.Features.Gyms.DTOs;

namespace BjjWorld.Application.Features.Gyms.Commands;

public sealed record CreateGymCommand : IRequest<GymDto> {
    public required GymDto Model { get; set; }
}


