// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

// Tests for GetStorePaginationQueryHandler.
//
// UNIT TEST SCOPE (cache-hit path only):
// The handler uses HybridCache + IRepository<Store> with MongoDB LINQ.
// The data-fetching factory path (CountAsync / ToListAsync from MongoDB.Driver.Linq)
// requires a real MongoDB instance — covered in BjjEire.Api.IntegrationTests.
//
// These unit tests verify:
//   A) Null-request guard
//   B) Handler returns whatever HybridCache provides (cache-hit)
//   C) Cache key formation

using AutoMapper;

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Stores.DTOs;
using BjjEire.Application.Features.Stores.Queries;
using BjjEire.Domain.Entities.Stores;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.Stores.Queries;

[Trait("Feature", "Stores")]
[Trait("Category", "Unit")]
public sealed class GetStorePaginationQueryHandlerTests
{
    private readonly Mock<IRepository<Store>> _repoMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly Mock<HybridCache> _cacheMock = new();
    private readonly Mock<IUriService> _uriServiceMock = new();
    private readonly Mock<ILogger<GetStorePaginationQueryHandler>> _loggerMock = new();

    private GetStorePaginationQueryHandler BuildHandler() =>
        new(_repoMock.Object, _mapperMock.Object, _cacheMock.Object,
            _uriServiceMock.Object, _loggerMock.Object);

    private static PagedResponse<StoreDto> BuildCachedResponse(int count = 1)
    {
        List<StoreDto> items = Enumerable.Range(0, count)
            .Select(i => new StoreDto
            {
                Id = ObjectIds.Valid1,
                Name = $"Store {i}",
                WebsiteUrl = "https://www.teststore.ie",
                IsActive = true
            })
            .ToList();

        return new PagedResponse<StoreDto>
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

    private void SetupCacheHit(PagedResponse<StoreDto> response, Action<string>? onKey = null)
    {
        _cacheMock
            .Setup(h => h.GetOrCreateAsync<Func<CancellationToken, ValueTask<PagedResponse<StoreDto>>>, PagedResponse<StoreDto>>(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<PagedResponse<StoreDto>>>>(),
                It.IsAny<Func<Func<CancellationToken, ValueTask<PagedResponse<StoreDto>>>, CancellationToken, ValueTask<PagedResponse<StoreDto>>>>(),
                It.IsAny<HybridCacheEntryOptions?>(),
                It.IsAny<IEnumerable<string>?>(),
                It.IsAny<CancellationToken>()))
            .Callback<string,
                Func<CancellationToken, ValueTask<PagedResponse<StoreDto>>>,
                Func<Func<CancellationToken, ValueTask<PagedResponse<StoreDto>>>, CancellationToken, ValueTask<PagedResponse<StoreDto>>>,
                HybridCacheEntryOptions?,
                IEnumerable<string>?,
                CancellationToken>((key, _, _, _, _, _) => onKey?.Invoke(key))
            .Returns(new ValueTask<PagedResponse<StoreDto>>(response));
    }

    [Fact]
    public async Task Handle_NullRequest_ThrowsArgumentNullException()
    {
        GetStorePaginationQueryHandler handler = BuildHandler();

        await Should.ThrowAsync<ArgumentNullException>(
            () => handler.Handle(null!, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_CacheHit_ReturnsCachedData()
    {
        PagedResponse<StoreDto> expected = BuildCachedResponse(3);
        SetupCacheHit(expected);

        PagedResponse<StoreDto> result = await BuildHandler().Handle(
            new GetStorePaginationQuery { Page = 1, PageSize = 20 }, CancellationToken.None);

        result.ShouldNotBeNull();
        result.Data.Count.ShouldBe(3);
        result.Pagination.TotalItems.ShouldBe(3);
    }

    [Fact]
    public async Task Handle_CacheHit_DataReferenceFlowsThrough()
    {
        PagedResponse<StoreDto> expected = BuildCachedResponse(1);
        SetupCacheHit(expected);

        PagedResponse<StoreDto> result = await BuildHandler().Handle(new GetStorePaginationQuery(), CancellationToken.None);

        result.Data.ShouldBeSameAs(expected.Data);
    }

    [Fact]
    public async Task Handle_CacheHit_EmptyResult_ReturnsEmptyData()
    {
        PagedResponse<StoreDto> expected = BuildCachedResponse(0);
        SetupCacheHit(expected);

        PagedResponse<StoreDto> result = await BuildHandler().Handle(new GetStorePaginationQuery(), CancellationToken.None);

        result.Data.ShouldBeEmpty();
        result.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task Handle_CacheKeyIncludesPageAndPageSize()
    {
        string? capturedKey = null;
        SetupCacheHit(BuildCachedResponse(1), key => capturedKey = key);

        await BuildHandler().Handle(
            new GetStorePaginationQuery { Page = 2, PageSize = 10 }, CancellationToken.None);

        capturedKey.ShouldNotBeNullOrEmpty();
        capturedKey.ShouldContain("2");
        capturedKey.ShouldContain("10");
    }
}
