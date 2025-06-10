
using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Features.Gyms.Commands;

public sealed record UpdateGymResponse() {
    public required GymDto Data { get; init; }

}
