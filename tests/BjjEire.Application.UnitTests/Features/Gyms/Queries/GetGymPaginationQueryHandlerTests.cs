// Tests for GetGymPaginationQueryHandler.
//
// UNIT TEST SCOPE (cache-hit path only):
// The handler uses HybridCache + IRepository<Gym> with MongoDB LINQ.
// The data-fetching factory path (CountAsync / ToListAsync from MongoDB.Driver.Linq)
// requires a real MongoDB instance — covered in BjjEire.Api.IntegrationTests.
//
// These unit tests verify:
//   A) Null-request guard
//   B) Handler returns whatever HybridCache provides (cache-hit)
//   C) Cache key formation includes County

using AutoMapper;

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Application.Features.Gyms.Queries;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Enums;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.Gyms.Queries;

[Trait("Feature", "Gyms")]
[Trait("Category", "Unit")]
public sealed class GetGymPaginationQueryHandlerTests
{
    private readonly Mock<IRepository<Gym>> _repoMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly Mock<HybridCache> _cacheMock = new();
    private readonly Mock<IUriService> _uriServiceMock = new();
    private readonly Mock<ILogger<GetGymPaginationQueryHandler>> _loggerMock = new();

    private GetGymPaginationQueryHandler BuildHandler() =>
        new(_repoMock.Object, _mapperMock.Object, _cacheMock.Object,
            _uriServiceMock.Object, _loggerMock.Object);

    private static GetGymPaginatedResponse BuildCachedResponse(int count = 1)
    {
        List<GymDto> items = Enumerable.Range(0, count)
            .Select(i => new GymDto
            {
                Id = ObjectIds.Valid1,
                Name = $"Gym {i}",
                Status = GymStatus.Active,
                County = County.Dublin,
                Location = new LocationDto
                {
                    Address = "1 Test St",
                    Venue = "Test Venue",
                    Coordinates = new GeoCoordinatesDto { Type = "Point", Coordinates = [-6.2, 53.3] }
                },
                SocialMedia = new SocialMediaDto(),
                TrialOffer = new TrialOfferDto { IsAvailable = false }
            })
            .ToList();

        return new GetGymPaginatedResponse
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
    private void SetupCacheHit(GetGymPaginatedResponse response)
    {
        _cacheMock
            .Setup(h => h.GetOrCreateAsync<Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>, GetGymPaginatedResponse>(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>>(),
                It.IsAny<Func<Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>, CancellationToken, ValueTask<GetGymPaginatedResponse>>>(),
                It.IsAny<HybridCacheEntryOptions?>(),
                It.IsAny<IEnumerable<string>?>(),
                It.IsAny<CancellationToken>()))
            .Returns(new ValueTask<GetGymPaginatedResponse>(response));
    }

    // ─── Null request ─────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_NullRequest_ThrowsArgumentNullException()
    {
        GetGymPaginationQueryHandler handler = BuildHandler();

        await Should.ThrowAsync<ArgumentNullException>(
            () => handler.Handle(null!, CancellationToken.None));
    }

    // ─── Cache-hit path ───────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_CacheHit_ReturnsCachedResponse()
    {
        GetGymPaginatedResponse expected = BuildCachedResponse(3);
        SetupCacheHit(expected);

        GetGymPaginatedResponse result = await BuildHandler().Handle(
            new GetGymPaginationQuery { Page = 1, PageSize = 20 }, CancellationToken.None);

        result.ShouldNotBeNull();
        result.Data.Count.ShouldBe(3);
        result.Pagination.TotalItems.ShouldBe(3);
    }

    [Fact]
    public async Task Handle_CacheHit_ReturnsSameReferenceAsCache()
    {
        GetGymPaginatedResponse expected = BuildCachedResponse(1);
        SetupCacheHit(expected);

        GetGymPaginatedResponse result = await BuildHandler().Handle(new GetGymPaginationQuery(), CancellationToken.None);

        result.ShouldBeSameAs(expected);
    }

    [Fact]
    public async Task Handle_CacheHit_EmptyResult_ReturnsEmptyData()
    {
        GetGymPaginatedResponse expected = BuildCachedResponse(0);
        SetupCacheHit(expected);

        GetGymPaginatedResponse result = await BuildHandler().Handle(new GetGymPaginationQuery(), CancellationToken.None);

        result.Data.ShouldBeEmpty();
        result.Pagination.TotalItems.ShouldBe(0);
    }

    // ─── Cache key formation ──────────────────────────────────────────────────

    [Fact]
    public async Task Handle_QueryWithCountyFilter_CacheKeyIncludesCounty()
    {
        string? capturedKey = null;
        GetGymPaginatedResponse expected = BuildCachedResponse(1);

        _cacheMock
            .Setup(h => h.GetOrCreateAsync<Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>, GetGymPaginatedResponse>(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>>(),
                It.IsAny<Func<Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>, CancellationToken, ValueTask<GetGymPaginatedResponse>>>(),
                It.IsAny<HybridCacheEntryOptions?>(),
                It.IsAny<IEnumerable<string>?>(),
                It.IsAny<CancellationToken>()))
            .Callback<string,
                Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>,
                Func<Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>, CancellationToken, ValueTask<GetGymPaginatedResponse>>,
                HybridCacheEntryOptions?,
                IEnumerable<string>?,
                CancellationToken>((key, _, _, _, _, _) => capturedKey = key)
            .Returns(new ValueTask<GetGymPaginatedResponse>(expected));

        await BuildHandler().Handle(
            new GetGymPaginationQuery { Page = 1, PageSize = 20, County = County.Cork }, CancellationToken.None);

        capturedKey.ShouldNotBeNullOrEmpty();
        capturedKey.ShouldContain("cork", Case.Insensitive);
    }

    [Fact]
    public async Task Handle_QueryWithNoCountyFilter_CacheKeyIncludesNonePlaceholder()
    {
        string? capturedKey = null;
        GetGymPaginatedResponse expected = BuildCachedResponse(0);

        _cacheMock
            .Setup(h => h.GetOrCreateAsync<Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>, GetGymPaginatedResponse>(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>>(),
                It.IsAny<Func<Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>, CancellationToken, ValueTask<GetGymPaginatedResponse>>>(),
                It.IsAny<HybridCacheEntryOptions?>(),
                It.IsAny<IEnumerable<string>?>(),
                It.IsAny<CancellationToken>()))
            .Callback<string,
                Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>,
                Func<Func<CancellationToken, ValueTask<GetGymPaginatedResponse>>, CancellationToken, ValueTask<GetGymPaginatedResponse>>,
                HybridCacheEntryOptions?,
                IEnumerable<string>?,
                CancellationToken>((key, _, _, _, _, _) => capturedKey = key)
            .Returns(new ValueTask<GetGymPaginatedResponse>(expected));

        await BuildHandler().Handle(new GetGymPaginationQuery { County = null }, CancellationToken.None);

        capturedKey.ShouldNotBeNullOrEmpty();
        capturedKey.ShouldContain("none", Case.Insensitive);
    }
}
