using Ardalis.GuardClauses;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Domain.Entities.Gyms;

namespace BjjEire.Application.Features.Gyms.Commands;

public sealed class UpdateGymCommandHandler(IGymService gymService, IMapper mapper) : IRequestHandler<UpdateGymCommand, UpdateGymResponse>
{
    private readonly IGymService _gymService = gymService;
    private readonly IMapper _mapper = mapper;

    public async Task<UpdateGymResponse> Handle(UpdateGymCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var gymEntity = await _gymService.GetByIdAsync(request.Model.Id);

        _ = Guard.Against.NotFound(request.Model!.Id, gymEntity);

        gymEntity = _mapper.Map<Gym>(gymEntity);
        await _gymService.UpdateAsync(gymEntity);
        var resultDto = _mapper.Map<GymDto>(gymEntity);

        return new UpdateGymResponse() { Model = resultDto };
    }
}
