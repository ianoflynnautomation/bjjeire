// Tests for GetBjjEventByPaginationQueryHandler.
//
// UNIT TEST SCOPE (cache-hit path only):
// The handler uses HybridCache + IRepository<BjjEvent> with MongoDB LINQ.
// The data-fetching factory path (which calls CountAsync / ToListAsync from
// MongoDB.Driver.Linq) requires a real MongoDB instance.  Those cases are
// covered in BjjEire.Api.IntegrationTests / BjjEire.Application.IntegrationTests.
//
// These unit tests verify:
//   A) Null-request guard
//   B) Handler returns whatever HybridCache provides (cache-hit)
//   C) Handler wires up logger calls without throwing

using AutoMapper;

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Application.Features.BjjEvents.Queries;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Enums;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.BjjEvents.Queries;

[Trait("Feature", "BjjEvents")]
[Trait("Category", "Unit")]
public sealed class GetBjjEventPaginationQueryHandlerTests
{
    private readonly Mock<IRepository<BjjEvent>> _repoMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly Mock<HybridCache> _cacheMock = new();
    private readonly Mock<IUriService> _uriServiceMock = new();
    private readonly TimeProvider _timeProvider = TimeProvider.System;
    private readonly Mock<ILogger<GetBjjEventByPaginationQueryHandler>> _loggerMock = new();

    private GetBjjEventByPaginationQueryHandler BuildHandler() =>
        new(_repoMock.Object, _mapperMock.Object, _cacheMock.Object,
            _uriServiceMock.Object, _timeProvider, _loggerMock.Object);

    private static PagedResponse<BjjEventDto> BuildCachedResponse(int count = 1)
    {
        List<BjjEventDto> items = Enumerable.Range(0, count)
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

        return new PagedResponse<BjjEventDto>
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

    private void SetupCacheHit(PagedResponse<BjjEventDto> response, Action<string>? onKey = null)
    {
        _cacheMock
            .Setup(h => h.GetOrCreateAsync<Func<CancellationToken, ValueTask<PagedResponse<BjjEventDto>>>, PagedResponse<BjjEventDto>>(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<PagedResponse<BjjEventDto>>>>(),
                It.IsAny<Func<Func<CancellationToken, ValueTask<PagedResponse<BjjEventDto>>>, CancellationToken, ValueTask<PagedResponse<BjjEventDto>>>>(),
                It.IsAny<HybridCacheEntryOptions?>(),
                It.IsAny<IEnumerable<string>?>(),
                It.IsAny<CancellationToken>()))
            .Callback<string,
                Func<CancellationToken, ValueTask<PagedResponse<BjjEventDto>>>,
                Func<Func<CancellationToken, ValueTask<PagedResponse<BjjEventDto>>>, CancellationToken, ValueTask<PagedResponse<BjjEventDto>>>,
                HybridCacheEntryOptions?,
                IEnumerable<string>?,
                CancellationToken>((key, _, _, _, _, _) => onKey?.Invoke(key))
            .Returns(new ValueTask<PagedResponse<BjjEventDto>>(response));
    }

    [Fact]
    public async Task Handle_NullRequest_ThrowsArgumentNullException()
    {
        GetBjjEventByPaginationQueryHandler handler = BuildHandler();

        await Should.ThrowAsync<ArgumentNullException>(
            () => handler.Handle(null!, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_CacheHit_ReturnsCachedData()
    {
        PagedResponse<BjjEventDto> expected = BuildCachedResponse(3);
        SetupCacheHit(expected);

        PagedResponse<BjjEventDto> result = await BuildHandler().Handle(
            new GetBjjEventPaginationQuery { Page = 1, PageSize = 20 }, CancellationToken.None);

        result.ShouldNotBeNull();
        result.Data.Count.ShouldBe(3);
        result.Pagination.TotalItems.ShouldBe(3);
    }

    [Fact]
    public async Task Handle_CacheHit_DataReferenceFlowsThrough()
    {
        PagedResponse<BjjEventDto> expected = BuildCachedResponse(1);
        SetupCacheHit(expected);

        PagedResponse<BjjEventDto> result = await BuildHandler().Handle(new GetBjjEventPaginationQuery(), CancellationToken.None);

        result.Data.ShouldBeSameAs(expected.Data);
    }

    [Fact]
    public async Task Handle_CacheHit_EmptyResult_ReturnsEmptyData()
    {
        PagedResponse<BjjEventDto> expected = BuildCachedResponse(0);
        SetupCacheHit(expected);

        PagedResponse<BjjEventDto> result = await BuildHandler().Handle(new GetBjjEventPaginationQuery(), CancellationToken.None);

        result.Data.ShouldBeEmpty();
        result.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task Handle_QueryWithCountyFilter_CacheKeyIncludesCounty()
    {
        string? capturedKey = null;
        SetupCacheHit(BuildCachedResponse(1), key => capturedKey = key);

        await BuildHandler().Handle(
            new GetBjjEventPaginationQuery { Page = 1, PageSize = 20, County = County.Dublin }, CancellationToken.None);

        capturedKey.ShouldNotBeNullOrEmpty();
        capturedKey.ShouldContain("Dublin", Case.Insensitive);
    }

    [Fact]
    public async Task Handle_QueryWithTypeFilter_CacheKeyIncludesType()
    {
        string? capturedKey = null;
        SetupCacheHit(BuildCachedResponse(1), key => capturedKey = key);

        await BuildHandler().Handle(new GetBjjEventPaginationQuery { Type = BjjEventType.Camp }, CancellationToken.None);

        capturedKey.ShouldNotBeNullOrEmpty();
        capturedKey.ShouldContain("Camp", Case.Insensitive);
    }
}
