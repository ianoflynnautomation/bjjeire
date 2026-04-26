// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Features.Gyms.Queries;

public sealed record GetGymByIdQuery : IRequest<GymDto?>
{
    public required string Id { get; init; }
}
