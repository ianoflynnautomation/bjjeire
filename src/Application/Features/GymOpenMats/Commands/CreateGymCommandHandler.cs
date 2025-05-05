

using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Features.GymOpenMats.DTOs;
using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Features.GymOpenMats.Commands;

public sealed class CreateGymCommandHandler(IGymService openMatService, IMapper mapper) 
    : IRequestHandler<CreateGymCommand, GymDto>
{
    private readonly IGymService _openMatService = openMatService;
    private readonly IMapper _mapper = mapper;

    public async Task<GymDto> Handle(CreateGymCommand request, CancellationToken cancellationToken)
    {
        var gymEntity = _mapper.Map<Gym>(request.Model);
        await _openMatService.Insert(gymEntity);
        var resultDto = _mapper.Map<GymDto>(gymEntity);
        return resultDto;
    }
}
