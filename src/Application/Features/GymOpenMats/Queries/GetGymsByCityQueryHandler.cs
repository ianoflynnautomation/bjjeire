using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Features.GymOpenMats.DTOs;

namespace BjjWorld.Application.Features.GymOpenMats.Queries;

public sealed class GetGymsByCityQueryHandler(IGymService openMatService, IMapper mapper)
    : IRequestHandler<GetGymsByCityQuery, IList<GymDto>>
{
    private readonly IGymService _openMatService = openMatService;
    private readonly IMapper _mapper = mapper;

    public async Task<IList<GymDto>> Handle(GetGymsByCityQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNullOrEmpty(request.City);
        var gyms = await _openMatService.GetByCity(request.City);
        var resultDto = _mapper.Map<IList<GymDto>>(gyms);
        return resultDto;
    }
}
