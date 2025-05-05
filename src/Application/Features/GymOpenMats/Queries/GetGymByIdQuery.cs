
using BjjWorld.Application.Features.GymOpenMats.DTOs;

namespace BjjWorld.Application.Features.GymOpenMats.Queries;

public class GetGenericQuery : IRequest<GymDto>
{
      public required string Id { get; set; }
}