// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed class CreateBjjEventCommandHandler(IBjjEventService bjjEventService, IMapper mapper)
    : IRequestHandler<CreateBjjEventCommand, CreateBjjEventResponse>
{

    public async Task<CreateBjjEventResponse> Handle(CreateBjjEventCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        BjjEvent bjjEventEntity = mapper.Map<BjjEvent>(request.Data);
        await bjjEventService.InsertAsync(bjjEventEntity);
        BjjEventDto resultDto = mapper.Map<BjjEventDto>(bjjEventEntity);
        return new CreateBjjEventResponse { Data = resultDto };
    }
}
