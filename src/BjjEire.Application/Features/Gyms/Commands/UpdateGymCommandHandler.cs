using BjjEire.Application.Common.Exceptions;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Domain.Entities.Gyms;

namespace BjjEire.Application.Features.Gyms.Commands;

public sealed class UpdateGymCommandHandler(IGymService gymService, IMapper mapper)
    : IRequestHandler<UpdateGymCommand, UpdateGymResponse>
{

    public async Task<UpdateGymResponse> Handle(UpdateGymCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var gymEntity = await gymService.GetByIdAsync(request.Data.Id)
 ?? throw new NotFoundException(nameof(Gym), request.Data.Id);

        _ = mapper.Map(request.Data, gymEntity);
        await gymService.UpdateAsync(gymEntity);
        var resultDto = mapper.Map<GymDto>(gymEntity);

        return new UpdateGymResponse { Data = resultDto };
    }
}
