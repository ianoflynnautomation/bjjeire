// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Application.Features.Gyms.Commands;

public sealed record DeleteGymCommand : IRequest<DeleteGymResponse>
{
    public required string Id { get; init; }
}

