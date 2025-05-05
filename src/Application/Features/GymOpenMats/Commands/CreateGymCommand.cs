
using BjjWorld.Application.Features.GymOpenMats.DTOs;

namespace BjjWorld.Application.Features.GymOpenMats.Commands;

public sealed record CreateGymCommand : IRequest<GymDto>
{
    public required GymDto Model { get; set; }
}


