// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Linq.Expressions;

using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Features.BjjEvents.Specifications;

public static class BjjEventSpecifications
{
    public static Expression<Func<BjjEvent, bool>> Active(DateTime nowUtc) =>
        e => e.IsActive
             && (e.Schedule.EndDate == null || e.Schedule.EndDate >= nowUtc);

    public static Expression<Func<BjjEvent, bool>> Expired(DateTime nowUtc) =>
        e => e.IsActive && e.Schedule.EndDate != null && e.Schedule.EndDate < nowUtc;
}
