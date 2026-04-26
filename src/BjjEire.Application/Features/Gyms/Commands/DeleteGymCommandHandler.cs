// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Exceptions;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities.Gyms;

namespace BjjEire.Application.Features.Gyms.Commands;

public sealed class DeleteGymCommandHandler(IGymService gymService)
    : IRequestHandler<DeleteGymCommand, DeleteGymResponse>
{

    public async Task<DeleteGymResponse> Handle(DeleteGymCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Gym gymEntity = await gymService.GetByIdAsync(request.Id)
 ?? throw new NotFoundException("Gym", request.Id);

        await gymService.DeleteAsync(gymEntity);
        return new DeleteGymResponse { IsSuccess = true };
    }
}
