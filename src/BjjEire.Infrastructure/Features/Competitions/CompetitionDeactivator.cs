using BjjEire.Application.Common;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.Competitions.Caching;
using BjjEire.Application.Features.Competitions.Services;
using BjjEire.Application.Features.Competitions.Specifications;
using BjjEire.Domain.Entities.Competitions;

using Microsoft.Extensions.Caching.Hybrid;

namespace BjjEire.Infrastructure.Features.Competitions;

public sealed class CompetitionDeactivator(
    IRepository<Competition> repository,
    HybridCache hybridCache,
    TimeProvider timeProvider) : ICompetitionDeactivator
{
    public async Task<long> DeactivateExpiredAsync(CancellationToken cancellationToken)
    {
        DateTime nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        UpdateBuilder<Competition> update = UpdateBuilder<Competition>.Create().Set(x => x.IsActive, false);

        long deactivatedCount = await repository.UpdateManyAsync(
            CompetitionSpecifications.Expired(nowUtc),
            update);

        if (deactivatedCount > 0)
        {
            await hybridCache.RemoveByTagAsync(CompetitionCacheKeys.Tag, cancellationToken);
        }

        return deactivatedCount;
    }
}
