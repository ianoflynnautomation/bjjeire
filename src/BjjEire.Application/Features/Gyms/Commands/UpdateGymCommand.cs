using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Features.Gyms.Commands;

public sealed record UpdateGymCommand : IRequest<UpdateGymResponse>
{
    public required GymDto Data { get; set; }
}
