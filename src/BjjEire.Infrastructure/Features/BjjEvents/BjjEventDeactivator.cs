using BjjEire.Application.Common;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.Caching;
using BjjEire.Application.Features.BjjEvents.Services;
using BjjEire.Application.Features.BjjEvents.Specifications;
using BjjEire.Domain.Entities.BjjEvents;

using Microsoft.Extensions.Caching.Hybrid;

namespace BjjEire.Infrastructure.Features.BjjEvents;

public sealed class BjjEventDeactivator(
    IRepository<BjjEvent> repository,
    HybridCache hybridCache,
    TimeProvider timeProvider) : IBjjEventDeactivator
{
    public async Task<long> DeactivateExpiredAsync(CancellationToken cancellationToken)
    {
        DateTime nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        UpdateBuilder<BjjEvent> update = UpdateBuilder<BjjEvent>.Create().Set(x => x.IsActive, false);

        long deactivatedCount = await repository.UpdateManyAsync(
            BjjEventSpecifications.Expired(nowUtc),
            update);

        if (deactivatedCount > 0)
        {
            await hybridCache.RemoveByTagAsync(BjjEventCacheKeys.Tag, cancellationToken);
        }

        return deactivatedCount;
    }
}
