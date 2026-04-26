// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed record UpdateBjjEventCommand : IRequest<UpdateBjjEventResponse>
{
    public required BjjEventDto Data { get; init; }
}
