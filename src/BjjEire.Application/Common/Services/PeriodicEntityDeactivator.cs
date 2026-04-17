using System.Linq.Expressions;

using BjjEire.Application.Common.Interfaces;
using BjjEire.Domain.Entities;

using Microsoft.Extensions.Caching.Hybrid;

namespace BjjEire.Application.Common.Services;

public abstract class PeriodicEntityDeactivator<TEntity>(
    IRepository<TEntity> repository,
    HybridCache hybridCache,
    TimeProvider timeProvider)
    : IDeactivator<TEntity>
    where TEntity : BaseEntity
{
    protected abstract string CacheTag { get; }

    protected abstract Expression<Func<TEntity, bool>> ExpiredPredicate(DateTime nowUtc);

    protected abstract UpdateBuilder<TEntity> DeactivationUpdate { get; }

    public async Task<long> DeactivateExpiredAsync(CancellationToken cancellationToken)
    {
        DateTime nowUtc = timeProvider.GetUtcNow().UtcDateTime;

        long deactivatedCount = await repository.UpdateManyAsync(
            ExpiredPredicate(nowUtc),
            DeactivationUpdate);

        if (deactivatedCount > 0)
        {
            await hybridCache.RemoveByTagAsync(CacheTag, cancellationToken);
        }

        return deactivatedCount;
    }
}
