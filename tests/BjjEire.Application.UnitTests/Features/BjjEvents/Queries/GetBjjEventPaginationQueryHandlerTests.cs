// Tests for GetBjjEventByPaginationQueryHandler.
//
// UNIT TEST SCOPE (cache-hit path only):
// The handler uses HybridCache + IRepository<BjjEvent> with MongoDB LINQ.
// The data-fetching factory path (which calls CountAsync / ToListAsync from
// MongoDB.Driver.Linq) requires a real MongoDB instance.  Those cases are
// covered in BjjEire.Api.IntegrationTests / BjjEire.Application.FunctionalTests.
//
// These unit tests verify:
//   A) Null-request guard
//   B) Handler returns whatever HybridCache provides (cache-hit)
//   C) Handler wires up logger calls without throwing

using AutoMapper;

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Application.Features.BjjEvents.Queries;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Enums;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Queries;

[Trait("Category", "BjjEvent")]
[Trait("Category", "Unit")]
public sealed class GetBjjEventPaginationQueryHandlerTests
{
    private readonly Mock<IRepository<BjjEvent>> _repoMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly Mock<HybridCache> _cacheMock = new();
    private readonly Mock<IUriService> _uriServiceMock = new();
    private readonly Mock<ILogger<GetBjjEventByPaginationQueryHandler>> _loggerMock = new();

    private GetBjjEventByPaginationQueryHandler BuildHandler() =>
        new(_repoMock.Object, _mapperMock.Object, _cacheMock.Object,
            _uriServiceMock.Object, _loggerMock.Object);

    // Builds the pre-packaged response the mock cache will return.
    private static GetBjjEventPaginatedResponse BuildCachedResponse(int count = 1)
    {
        var items = Enumerable.Range(0, count)
            .Select(i => new BjjEventDto
            {
                Id = ObjectIds.Valid1,
                Name = $"Event {i}",
                Type = BjjEventType.Seminar,
                Status = EventStatus.Upcoming,
                County = County.Dublin,
                Organiser = new OrganizerDto { Name = "Club", Website = "" },
                Location = new LocationDto(),
                Schedule = new BjjEventScheduleDto
                {
                    StartDate = DateTime.UtcNow.AddDays(7),
                    EndDate = DateTime.UtcNow.AddDays(8),
                    Hours = [new BjjEventHoursDto { Day = DayOfWeek.Saturday, OpenTime = TimeSpan.FromHours(10), CloseTime = TimeSpan.FromHours(18) }]
                },
                Pricing = new PricingModelDto { Type = PricingType.Free },
                EventUrl = "",
                ImageUrl = ""
            })
            .ToList();

        return new GetBjjEventPaginatedResponse
        {
            Data = items,
            Pagination = new PaginationMetadataDto
            {
                TotalItems = count,
                CurrentPage = 1,
                PageSize = 20,
                TotalPages = 1
            }
        };
    }

    // HybridCache.GetOrCreateAsync<T> (no state) is a non-virtual wrapper that calls
    // the abstract GetOrCreateAsync<TState, T> with TState = Func<CancellationToken, ValueTask<T>>.
    // Moq can only intercept the abstract overload, so we match TState explicitly.
    private void SetupCacheHit(GetBjjEventPaginatedResponse response)
    {
        _cacheMock
            .Setup(h => h.GetOrCreateAsync<Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>, GetBjjEventPaginatedResponse>(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>>(),
                It.IsAny<Func<Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>, CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>>(),
                It.IsAny<HybridCacheEntryOptions?>(),
                It.IsAny<IEnumerable<string>?>(),
                It.IsAny<CancellationToken>()))
            .Returns(new ValueTask<GetBjjEventPaginatedResponse>(response));
    }

    // ─── Null request ─────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_NullRequest_ThrowsArgumentNullException()
    {
        var handler = BuildHandler();

        await Should.ThrowAsync<ArgumentNullException>(
            () => handler.Handle(null!, CancellationToken.None));
    }

    // ─── Cache-hit path ───────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_CacheHit_ReturnsCachedResponse()
    {
        var expected = BuildCachedResponse(3);
        SetupCacheHit(expected);

        var handler = BuildHandler();
        var query = new GetBjjEventPaginationQuery { Page = 1, PageSize = 20 };

        var result = await handler.Handle(query, CancellationToken.None);

        result.ShouldNotBeNull();
        result.Data.Count.ShouldBe(3);
        result.Pagination.TotalItems.ShouldBe(3);
    }

    [Fact]
    public async Task Handle_CacheHit_ReturnsSameReferenceAsCache()
    {
        var expected = BuildCachedResponse(1);
        SetupCacheHit(expected);

        var handler = BuildHandler();

        var result = await handler.Handle(new GetBjjEventPaginationQuery(), CancellationToken.None);

        result.ShouldBeSameAs(expected);
    }

    [Fact]
    public async Task Handle_CacheHit_EmptyResult_ReturnsEmptyData()
    {
        var expected = BuildCachedResponse(0);
        SetupCacheHit(expected);

        var handler = BuildHandler();

        var result = await handler.Handle(new GetBjjEventPaginationQuery(), CancellationToken.None);

        result.Data.ShouldBeEmpty();
        result.Pagination.TotalItems.ShouldBe(0);
    }

    // ─── Cache key formation ──────────────────────────────────────────────────

    [Fact]
    public async Task Handle_QueryWithCountyFilter_PassesQueryToCache()
    {
        // We capture which cache key is used to confirm County is included.
        string? capturedKey = null;
        var expected = BuildCachedResponse(1);

        _cacheMock
            .Setup(h => h.GetOrCreateAsync<Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>, GetBjjEventPaginatedResponse>(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>>(),
                It.IsAny<Func<Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>, CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>>(),
                It.IsAny<HybridCacheEntryOptions?>(),
                It.IsAny<IEnumerable<string>?>(),
                It.IsAny<CancellationToken>()))
            .Callback<string,
                Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>,
                Func<Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>, CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>,
                HybridCacheEntryOptions?,
                IEnumerable<string>?,
                CancellationToken>((key, _, _, _, _, _) => capturedKey = key)
            .Returns(new ValueTask<GetBjjEventPaginatedResponse>(expected));

        var handler = BuildHandler();
        var query = new GetBjjEventPaginationQuery { Page = 1, PageSize = 20, County = County.Dublin };

        await handler.Handle(query, CancellationToken.None);

        capturedKey.ShouldNotBeNullOrEmpty();
        // The cache key should reflect the county parameter.
        capturedKey.ShouldContain("Dublin", Case.Insensitive);
    }

    [Fact]
    public async Task Handle_QueryWithTypeFilter_PassesQueryToCache()
    {
        string? capturedKey = null;
        var expected = BuildCachedResponse(1);

        _cacheMock
            .Setup(h => h.GetOrCreateAsync<Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>, GetBjjEventPaginatedResponse>(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>>(),
                It.IsAny<Func<Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>, CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>>(),
                It.IsAny<HybridCacheEntryOptions?>(),
                It.IsAny<IEnumerable<string>?>(),
                It.IsAny<CancellationToken>()))
            .Callback<string,
                Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>,
                Func<Func<CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>, CancellationToken, ValueTask<GetBjjEventPaginatedResponse>>,
                HybridCacheEntryOptions?,
                IEnumerable<string>?,
                CancellationToken>((key, _, _, _, _, _) => capturedKey = key)
            .Returns(new ValueTask<GetBjjEventPaginatedResponse>(expected));

        var handler = BuildHandler();
        var query = new GetBjjEventPaginationQuery { Type = BjjEventType.Tournament };

        await handler.Handle(query, CancellationToken.None);

        capturedKey.ShouldNotBeNullOrEmpty();
        capturedKey.ShouldContain("Tournament", Case.Insensitive);
    }
}
