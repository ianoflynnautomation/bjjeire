// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

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
using BjjEire.Application.Common.Models;
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

    private static PagedResponse<GymDto> BuildCachedResponse(int count = 1)
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

        return new PagedResponse<GymDto>
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
    private void SetupCacheHit(PagedResponse<GymDto> response, Action<string>? onKey = null)
    {
        _cacheMock
            .Setup(h => h.GetOrCreateAsync<Func<CancellationToken, ValueTask<PagedResponse<GymDto>>>, PagedResponse<GymDto>>(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<PagedResponse<GymDto>>>>(),
                It.IsAny<Func<Func<CancellationToken, ValueTask<PagedResponse<GymDto>>>, CancellationToken, ValueTask<PagedResponse<GymDto>>>>(),
                It.IsAny<HybridCacheEntryOptions?>(),
                It.IsAny<IEnumerable<string>?>(),
                It.IsAny<CancellationToken>()))
            .Callback<string,
                Func<CancellationToken, ValueTask<PagedResponse<GymDto>>>,
                Func<Func<CancellationToken, ValueTask<PagedResponse<GymDto>>>, CancellationToken, ValueTask<PagedResponse<GymDto>>>,
                HybridCacheEntryOptions?,
                IEnumerable<string>?,
                CancellationToken>((key, _, _, _, _, _) => onKey?.Invoke(key))
            .Returns(new ValueTask<PagedResponse<GymDto>>(response));
    }

    [Fact]
    public async Task Handle_NullRequest_ThrowsArgumentNullException()
    {
        GetGymPaginationQueryHandler handler = BuildHandler();

        await Should.ThrowAsync<ArgumentNullException>(
            () => handler.Handle(null!, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_CacheHit_ReturnsCachedData()
    {
        PagedResponse<GymDto> expected = BuildCachedResponse(3);
        SetupCacheHit(expected);

        PagedResponse<GymDto> result = await BuildHandler().Handle(
            new GetGymPaginationQuery { Page = 1, PageSize = 20 }, CancellationToken.None);

        result.ShouldNotBeNull();
        result.Data.Count.ShouldBe(3);
        result.Pagination.TotalItems.ShouldBe(3);
    }

    [Fact]
    public async Task Handle_CacheHit_DataReferenceFlowsThrough()
    {
        PagedResponse<GymDto> expected = BuildCachedResponse(1);
        SetupCacheHit(expected);

        PagedResponse<GymDto> result = await BuildHandler().Handle(new GetGymPaginationQuery(), CancellationToken.None);

        // Navigation URIs are applied post-cache via `with` (new record), but Data list reference is preserved.
        result.Data.ShouldBeSameAs(expected.Data);
    }

    [Fact]
    public async Task Handle_CacheHit_EmptyResult_ReturnsEmptyData()
    {
        PagedResponse<GymDto> expected = BuildCachedResponse(0);
        SetupCacheHit(expected);

        PagedResponse<GymDto> result = await BuildHandler().Handle(new GetGymPaginationQuery(), CancellationToken.None);

        result.Data.ShouldBeEmpty();
        result.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task Handle_QueryWithCountyFilter_CacheKeyIncludesCounty()
    {
        string? capturedKey = null;
        SetupCacheHit(BuildCachedResponse(1), key => capturedKey = key);

        await BuildHandler().Handle(
            new GetGymPaginationQuery { Page = 1, PageSize = 20, County = County.Cork }, CancellationToken.None);

        capturedKey.ShouldNotBeNullOrEmpty();
        capturedKey.ShouldContain("cork", Case.Insensitive);
    }

    [Fact]
    public async Task Handle_QueryWithNoCountyFilter_CacheKeyIncludesNonePlaceholder()
    {
        string? capturedKey = null;
        SetupCacheHit(BuildCachedResponse(0), key => capturedKey = key);

        await BuildHandler().Handle(new GetGymPaginationQuery { County = null }, CancellationToken.None);

        capturedKey.ShouldNotBeNullOrEmpty();
        capturedKey.ShouldContain("none", Case.Insensitive);
    }
}
