// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Services;
using BjjEire.Application.Features.BjjEvents.Caching;
using BjjEire.Application.Features.BjjEvents.Specifications;
using BjjEire.Domain.Entities.BjjEvents;

using Microsoft.Extensions.Caching.Hybrid;

namespace BjjEire.Infrastructure.Features.BjjEvents;

public sealed class BjjEventDeactivator(
    IRepository<BjjEvent> repository,
    HybridCache hybridCache,
    TimeProvider timeProvider)
    : PeriodicEntityDeactivator<BjjEvent>(repository, hybridCache, timeProvider)
{
    public const string ConfigSectionName = "BjjEventDeactivation";

    protected override string CacheTag => BjjEventCacheKeys.Tag;

    protected override Expression<Func<BjjEvent, bool>> ExpiredPredicate(DateTime nowUtc)
        => BjjEventSpecifications.Expired(nowUtc);

    protected override UpdateBuilder<BjjEvent> DeactivationUpdate =>
        UpdateBuilder<BjjEvent>.Create().Set(x => x.IsActive, false);
}
