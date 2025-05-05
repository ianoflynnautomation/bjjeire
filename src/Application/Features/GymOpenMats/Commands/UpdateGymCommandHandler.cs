using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Features.GymOpenMats.DTOs;
using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Features.GymOpenMats.Commands;

public sealed class UpdateGymCommandHandler(IGymService openMatService, IMapper mapper) : IRequestHandler<UpdateGymCommand, GymDto>
{
    private readonly IGymService _openMatService = openMatService;
    private readonly IMapper _mapper = mapper;

    public async Task<GymDto> Handle(UpdateGymCommand request, CancellationToken cancellationToken)
    {
        var gymEntity = await _openMatService.GetById(request.Model.Id);
        gymEntity = _mapper.Map<Gym>(gymEntity);
        await _openMatService.Update(gymEntity);
        var resultDto = _mapper.Map<GymDto>(gymEntity);
        return resultDto;
    }
}
