using BjjEire.Application.Features.Competitions.Specifications;
using BjjEire.Domain.Entities.Competitions;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.Competitions.Specifications;

[Trait("Category", "Competition")]
[Trait("Category", "Unit")]
public sealed class CompetitionSpecificationsTests
{
    private static readonly DateTime Now = new(2026, 04, 10, 12, 0, 0, DateTimeKind.Utc);

    private static Competition Build(
        bool isActive = true,
        DateTime? startDate = null,
        DateTime? endDate = null) => new()
        {
            IsActive = isActive,
            StartDate = startDate,
            EndDate = endDate,
        };

    // ─── Active ───────────────────────────────────────────────────────────────

    [Fact]
    public void Active_CurrentlyRunningCompetition_ReturnsTrue()
    {
        var predicate = CompetitionSpecifications.Active(Now).Compile();
        var competition = Build(
            startDate: Now.AddDays(-1),
            endDate: Now.AddDays(1));

        predicate(competition).ShouldBeTrue();
    }

    [Fact]
    public void Active_FutureCompetition_ReturnsTrue()
    {
        // A competition that hasn't started yet is still considered listable/active —
        // users need to see upcoming events. Only expired or deactivated should drop out.
        var predicate = CompetitionSpecifications.Active(Now).Compile();
        var competition = Build(
            startDate: Now.AddDays(30),
            endDate: Now.AddDays(31));

        predicate(competition).ShouldBeTrue();
    }

    [Fact]
    public void Active_ExpiredCompetition_ReturnsFalse()
    {
        var predicate = CompetitionSpecifications.Active(Now).Compile();
        var competition = Build(
            startDate: Now.AddDays(-10),
            endDate: Now.AddDays(-1));

        predicate(competition).ShouldBeFalse();
    }

    [Fact]
    public void Active_FlaggedInactive_ReturnsFalse()
    {
        var predicate = CompetitionSpecifications.Active(Now).Compile();
        var competition = Build(
            isActive: false,
            startDate: Now.AddDays(-1),
            endDate: Now.AddDays(1));

        predicate(competition).ShouldBeFalse();
    }

    [Fact]
    public void Active_OpenEndedCompetition_ReturnsTrue()
    {
        var predicate = CompetitionSpecifications.Active(Now).Compile();
        var competition = Build(
            startDate: Now.AddDays(-1),
            endDate: null);

        predicate(competition).ShouldBeTrue();
    }

    [Fact]
    public void Active_NoStartDate_ReturnsTrueWhenNotExpired()
    {
        var predicate = CompetitionSpecifications.Active(Now).Compile();
        var competition = Build(
            startDate: null,
            endDate: Now.AddDays(1));

        predicate(competition).ShouldBeTrue();
    }

    [Fact]
    public void Active_EndDateExactlyNow_ReturnsTrue()
    {
        // Boundary: endDate >= now, so a competition ending exactly at 'now' is still active.
        var predicate = CompetitionSpecifications.Active(Now).Compile();
        var competition = Build(
            startDate: Now.AddDays(-1),
            endDate: Now);

        predicate(competition).ShouldBeTrue();
    }

    // ─── Expired ──────────────────────────────────────────────────────────────

    [Fact]
    public void Expired_ActiveCompetitionWithPastEndDate_ReturnsTrue()
    {
        var predicate = CompetitionSpecifications.Expired(Now).Compile();
        var competition = Build(
            startDate: Now.AddDays(-10),
            endDate: Now.AddDays(-1));

        predicate(competition).ShouldBeTrue();
    }

    [Fact]
    public void Expired_AlreadyInactive_ReturnsFalse()
    {
        // Idempotency: an already-deactivated competition must not match the sweep filter,
        // otherwise the background job would re-update the same documents every run.
        var predicate = CompetitionSpecifications.Expired(Now).Compile();
        var competition = Build(
            isActive: false,
            endDate: Now.AddDays(-1));

        predicate(competition).ShouldBeFalse();
    }

    [Fact]
    public void Expired_OpenEndedCompetition_ReturnsFalse()
    {
        // Null EndDate = open-ended. The sweep must leave these alone.
        var predicate = CompetitionSpecifications.Expired(Now).Compile();
        var competition = Build(
            startDate: Now.AddDays(-365),
            endDate: null);

        predicate(competition).ShouldBeFalse();
    }

    [Fact]
    public void Expired_FutureEndDate_ReturnsFalse()
    {
        var predicate = CompetitionSpecifications.Expired(Now).Compile();
        var competition = Build(
            startDate: Now.AddDays(-1),
            endDate: Now.AddDays(1));

        predicate(competition).ShouldBeFalse();
    }

    [Fact]
    public void Expired_EndDateExactlyNow_ReturnsFalse()
    {
        // Boundary: Expired is strict less-than, so end == now is NOT expired (matches Active).
        var predicate = CompetitionSpecifications.Expired(Now).Compile();
        var competition = Build(endDate: Now);

        predicate(competition).ShouldBeFalse();
    }
}
