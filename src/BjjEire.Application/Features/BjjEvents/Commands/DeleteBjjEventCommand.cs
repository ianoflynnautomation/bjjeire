// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Application.Features.BjjEvents.Commands;

public sealed record DeleteBjjEventCommand : IRequest<DeleteBjjEventResponse>
{
    public required string Id { get; init; }
}

