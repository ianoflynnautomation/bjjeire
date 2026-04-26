// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.Gyms.Queries;

public record GetGymPaginationQuery : BasePaginationQuery, IRequest<PagedResponse<GymDto>>
{
    public County? County { get; set; }
}
