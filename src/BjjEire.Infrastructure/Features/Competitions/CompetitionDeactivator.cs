using BjjEire.Application.Common;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Services;
using BjjEire.Application.Features.Competitions.Caching;
using BjjEire.Application.Features.Competitions.Specifications;
using BjjEire.Domain.Entities.Competitions;

using Microsoft.Extensions.Caching.Hybrid;

namespace BjjEire.Infrastructure.Features.Competitions;

public sealed class CompetitionDeactivator(
    IRepository<Competition> repository,
    HybridCache hybridCache,
    TimeProvider timeProvider)
    : PeriodicEntityDeactivator<Competition>(repository, hybridCache, timeProvider)
{
    public const string ConfigSectionName = "CompetitionDeactivation";

    protected override string CacheTag => CompetitionCacheKeys.Tag;

    protected override Expression<Func<Competition, bool>> ExpiredPredicate(DateTime nowUtc)
        => CompetitionSpecifications.Expired(nowUtc);

    protected override UpdateBuilder<Competition> DeactivationUpdate =>
        UpdateBuilder<Competition>.Create().Set(x => x.IsActive, false);
}
