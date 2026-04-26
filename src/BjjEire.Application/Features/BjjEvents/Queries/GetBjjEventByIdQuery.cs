// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Features.BjjEvents.Queries;

public sealed record GetBjjEventByIdQuery : IRequest<BjjEventDto?>
{
    public required string Id { get; init; }
}
