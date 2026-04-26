// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

// Tests for PeriodicEntityDeactivator<TEntity>.
//
// The base class owns the "UpdateMany by expired predicate + invalidate cache tag"
// shape that is today copy-pasted into each feature's {Feature}Deactivator. These
// tests verify that shape directly against a fake subclass, so per-feature
// deactivators can be collapsed to template-method overrides.

using System.Linq.Expressions;

using BjjEire.Application.Common;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Services;
using BjjEire.Domain.Entities;

using Microsoft.Extensions.Caching.Hybrid;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Common.Services;

[Trait("Feature", "Common")]
[Trait("Category", "Unit")]
public sealed class PeriodicEntityDeactivatorTests
{
    private readonly Mock<IRepository<FakeEntity>> _repoMock = new();
    private readonly Mock<HybridCache> _cacheMock = new();
    private readonly FixedTimeProvider _timeProvider = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));

    private FakeDeactivator BuildSut() =>
        new(_repoMock.Object, _cacheMock.Object, _timeProvider);

    [Fact]
    public async Task DeactivateExpiredAsync_UpdatesCountReturned_InvalidatesCacheTag_WhenMatches()
    {
        _repoMock
            .Setup(r => r.UpdateManyAsync(It.IsAny<Expression<Func<FakeEntity, bool>>>(), It.IsAny<UpdateBuilder<FakeEntity>>()))
            .ReturnsAsync(3);

        long count = await BuildSut().DeactivateExpiredAsync(CancellationToken.None);

        count.ShouldBe(3);
        _cacheMock.Verify(c => c.RemoveByTagAsync(FakeDeactivator.Tag, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeactivateExpiredAsync_NoMatches_SkipsCacheInvalidation()
    {
        _repoMock
            .Setup(r => r.UpdateManyAsync(It.IsAny<Expression<Func<FakeEntity, bool>>>(), It.IsAny<UpdateBuilder<FakeEntity>>()))
            .ReturnsAsync(0);

        long count = await BuildSut().DeactivateExpiredAsync(CancellationToken.None);

        count.ShouldBe(0);
        _cacheMock.Verify(c => c.RemoveByTagAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeactivateExpiredAsync_PassesNowUtcFromTimeProviderToPredicate()
    {
        DateTime frozen = new(2026, 4, 16, 12, 0, 0, DateTimeKind.Utc);
        _timeProvider.SetUtcNow(frozen);

        DateTime? captured = null;
        _repoMock
            .Setup(r => r.UpdateManyAsync(It.IsAny<Expression<Func<FakeEntity, bool>>>(), It.IsAny<UpdateBuilder<FakeEntity>>()))
            .ReturnsAsync(0);

        FakeDeactivator sut = BuildSut();
        sut.OnBuildPredicate = nowUtc => captured = nowUtc;

        await sut.DeactivateExpiredAsync(CancellationToken.None);

        captured.ShouldBe(frozen);
    }

    // ─── Fakes ──────────────────────────────────────────────────────────────

    // Minimal stand-in for FakeTimeProvider (not available in this repo's package set).
    private sealed class FixedTimeProvider(DateTimeOffset initial) : TimeProvider
    {
        private DateTimeOffset _now = initial;

        public void SetUtcNow(DateTime utc) => _now = new DateTimeOffset(DateTime.SpecifyKind(utc, DateTimeKind.Utc), TimeSpan.Zero);

        public override DateTimeOffset GetUtcNow() => _now;
    }

    public sealed class FakeEntity : BaseEntity
    {
        public bool IsActive { get; set; } = true;
    }

    public sealed class FakeDeactivator(
        IRepository<FakeEntity> repo,
        HybridCache cache,
        TimeProvider time)
        : PeriodicEntityDeactivator<FakeEntity>(repo, cache, time)
    {
        public const string Tag = "fake-entities";

        public Action<DateTime>? OnBuildPredicate { get; set; }

        protected override string CacheTag => Tag;

        protected override Expression<Func<FakeEntity, bool>> ExpiredPredicate(DateTime nowUtc)
        {
            OnBuildPredicate?.Invoke(nowUtc);
            return e => !e.IsActive;
        }

        protected override UpdateBuilder<FakeEntity> DeactivationUpdate =>
            UpdateBuilder<FakeEntity>.Create().Set(x => x.IsActive, false);
    }
}
