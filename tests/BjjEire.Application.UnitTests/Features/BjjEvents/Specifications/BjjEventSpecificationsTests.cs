using BjjEire.Application.Features.BjjEvents.Specifications;
using BjjEire.Domain.Entities.BjjEvents;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Specifications;

[Trait("Category", "BjjEvent")]
[Trait("Category", "Unit")]
public sealed class BjjEventSpecificationsTests
{
    private static readonly DateTime Now = new(2026, 04, 10, 12, 0, 0, DateTimeKind.Utc);

    private static BjjEvent Build(
        bool isActive = true,
        DateTime? startDate = null,
        DateTime? endDate = null) => new()
        {
            IsActive = isActive,
            Schedule = new BjjEventSchedule
            {
                StartDate = startDate,
                EndDate = endDate,
            },
        };

    // ─── Active ───────────────────────────────────────────────────────────────

    [Fact]
    public void Active_CurrentlyRunningEvent_ReturnsTrue()
    {
        var predicate = BjjEventSpecifications.Active(Now).Compile();
        var bjjEvent = Build(
            startDate: Now.AddDays(-1),
            endDate: Now.AddDays(1));

        predicate(bjjEvent).ShouldBeTrue();
    }

    [Fact]
    public void Active_FutureEvent_ReturnsTrue()
    {
        // Upcoming events must remain listable — users need to see them before they start.
        var predicate = BjjEventSpecifications.Active(Now).Compile();
        var bjjEvent = Build(
            startDate: Now.AddDays(30),
            endDate: Now.AddDays(31));

        predicate(bjjEvent).ShouldBeTrue();
    }

    [Fact]
    public void Active_ExpiredEvent_ReturnsFalse()
    {
        var predicate = BjjEventSpecifications.Active(Now).Compile();
        var bjjEvent = Build(
            startDate: Now.AddDays(-10),
            endDate: Now.AddDays(-1));

        predicate(bjjEvent).ShouldBeFalse();
    }

    [Fact]
    public void Active_FlaggedInactive_ReturnsFalse()
    {
        var predicate = BjjEventSpecifications.Active(Now).Compile();
        var bjjEvent = Build(
            isActive: false,
            startDate: Now.AddDays(-1),
            endDate: Now.AddDays(1));

        predicate(bjjEvent).ShouldBeFalse();
    }

    [Fact]
    public void Active_OpenEndedEvent_ReturnsTrue()
    {
        var predicate = BjjEventSpecifications.Active(Now).Compile();
        var bjjEvent = Build(
            startDate: Now.AddDays(-1),
            endDate: null);

        predicate(bjjEvent).ShouldBeTrue();
    }

    [Fact]
    public void Active_EndDateExactlyNow_ReturnsTrue()
    {
        // Boundary: endDate >= now, so an event ending exactly at 'now' is still active.
        var predicate = BjjEventSpecifications.Active(Now).Compile();
        var bjjEvent = Build(
            startDate: Now.AddDays(-1),
            endDate: Now);

        predicate(bjjEvent).ShouldBeTrue();
    }

    // ─── Expired ──────────────────────────────────────────────────────────────

    [Fact]
    public void Expired_ActiveEventWithPastEndDate_ReturnsTrue()
    {
        var predicate = BjjEventSpecifications.Expired(Now).Compile();
        var bjjEvent = Build(
            startDate: Now.AddDays(-10),
            endDate: Now.AddDays(-1));

        predicate(bjjEvent).ShouldBeTrue();
    }

    [Fact]
    public void Expired_AlreadyInactive_ReturnsFalse()
    {
        // Idempotency: an already-deactivated event must not match the sweep filter,
        // otherwise the background job would re-update the same documents every run.
        var predicate = BjjEventSpecifications.Expired(Now).Compile();
        var bjjEvent = Build(
            isActive: false,
            endDate: Now.AddDays(-1));

        predicate(bjjEvent).ShouldBeFalse();
    }

    [Fact]
    public void Expired_OpenEndedEvent_ReturnsFalse()
    {
        // Null EndDate = open-ended. The sweep must leave these alone.
        var predicate = BjjEventSpecifications.Expired(Now).Compile();
        var bjjEvent = Build(
            startDate: Now.AddDays(-365),
            endDate: null);

        predicate(bjjEvent).ShouldBeFalse();
    }

    [Fact]
    public void Expired_FutureEndDate_ReturnsFalse()
    {
        var predicate = BjjEventSpecifications.Expired(Now).Compile();
        var bjjEvent = Build(
            startDate: Now.AddDays(-1),
            endDate: Now.AddDays(1));

        predicate(bjjEvent).ShouldBeFalse();
    }

    [Fact]
    public void Expired_EndDateExactlyNow_ReturnsFalse()
    {
        // Boundary: Expired is strict less-than, so end == now is NOT expired (matches Active).
        var predicate = BjjEventSpecifications.Expired(Now).Compile();
        var bjjEvent = Build(endDate: Now);

        predicate(bjjEvent).ShouldBeFalse();
    }

}
