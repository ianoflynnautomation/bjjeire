using BjjWorld.Application.Features.GymOpenMats.DTOs;

namespace BjjWorld.Application.Features.GymOpenMats.Commands;

public sealed record UpdateGymCommand : IRequest<GymDto>
{
    public required GymDto Model { get; set; }
}
