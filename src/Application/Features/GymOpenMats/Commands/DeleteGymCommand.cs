
using BjjWorld.Application.Features.GymOpenMats.DTOs;

namespace BjjWorld.Application.Features.GymOpenMats.Commands;

public sealed record DeleteGymCommand : IRequest<bool>
{
    public required GymDto Model { get; set; }
}

