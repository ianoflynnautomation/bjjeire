using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Features.GymOpenMats.DTOs;

namespace BjjWorld.Application.Features.GymOpenMats.Queries;

public sealed class GetGymByIdQueryHandler(IGymService openMatService, IMapper mapper)
    : IRequestHandler<GetGenericQuery, GymDto>
{
    private readonly IGymService _openMatService = openMatService;
    private readonly IMapper _mapper = mapper;

    public async Task<GymDto> Handle(GetGenericQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNullOrEmpty(request.Id);
        var gym = await _openMatService.GetById(request.Id);
        var resultDto = _mapper.Map<GymDto>(gym);
        return resultDto;
    }
}
