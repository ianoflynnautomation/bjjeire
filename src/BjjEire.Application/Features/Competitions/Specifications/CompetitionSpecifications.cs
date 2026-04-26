// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Linq.Expressions;

using BjjEire.Domain.Entities.Competitions;

namespace BjjEire.Application.Features.Competitions.Specifications;

public static class CompetitionSpecifications
{
    public static Expression<Func<Competition, bool>> Active(DateTime nowUtc) =>
        c => c.IsActive
             && (c.EndDate == null || c.EndDate >= nowUtc);

    public static Expression<Func<Competition, bool>> Expired(DateTime nowUtc) =>
        c => c.IsActive && c.EndDate != null && c.EndDate < nowUtc;
}
