using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Domain.Entities.Gyms;

namespace BjjEire.Application.Features.Gyms.Commands;

public sealed class CreateGymCommandHandler(IGymService gymService, IMapper mapper)
    : IRequestHandler<CreateGymCommand, CreateGymResponse>
{

    public async Task<CreateGymResponse> Handle(CreateGymCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        Gym gymEntity = mapper.Map<Gym>(request.Data);
        await gymService.InsertAsync(gymEntity);
        GymDto resultDto = mapper.Map<GymDto>(gymEntity);
        return new CreateGymResponse { Data = resultDto };
    }
}
