
using BjjWorld.Application.Features.GymOpenMats.DTOs;

namespace BjjWorld.Application.Features.GymOpenMats.Queries;

public class GetGymsByCityQuery : IRequest<IList<GymDto>>
{
    public required string City { get; set; }
}

