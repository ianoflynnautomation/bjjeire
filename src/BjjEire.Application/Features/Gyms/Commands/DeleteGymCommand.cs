using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Features.Gyms.Commands;

public sealed record DeleteGymCommand : IRequest<DeleteGymResponse> {
      public required string Id { get; set; }
}

