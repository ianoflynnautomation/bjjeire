

using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Features.Gyms.DTOs;
using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Features.Gyms.Commands;

public sealed class CreateGymCommandHandler(IGymService gymService, IMapper mapper) 
    : IRequestHandler<CreateGymCommand, GymDto>
{
    private readonly IGymService _gymService = gymService;
    private readonly IMapper _mapper = mapper;

    public async Task<GymDto> Handle(CreateGymCommand request, CancellationToken cancellationToken)
    {
        var gymEntity = _mapper.Map<Gym>(request.Model);
        await _gymService.Insert(gymEntity);
        var resultDto = _mapper.Map<GymDto>(gymEntity);
        return resultDto;
    }
}
