// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.BjjEvents.Queries;

public record GetBjjEventPaginationQuery : BasePaginationQuery, IRequest<PagedResponse<BjjEventDto>>
{
    public County? County { get; set; }
    public BjjEventType? Type { get; set; }
    public bool IncludeInactive { get; init; }
}
