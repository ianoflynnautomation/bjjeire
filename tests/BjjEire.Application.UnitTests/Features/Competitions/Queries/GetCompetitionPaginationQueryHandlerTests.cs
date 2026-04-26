// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

// Tests for GetCompetitionPaginationQueryHandler.
//
// UNIT TEST SCOPE (cache-hit path only):
// The handler uses HybridCache + IRepository<Competition> with MongoDB LINQ.
// The data-fetching factory path (CountAsync / ToListAsync from MongoDB.Driver.Linq)
// requires a real MongoDB instance — covered in BjjEire.Api.IntegrationTests.
//
// These unit tests verify:
//   A) Null-request guard
//   B) Handler returns whatever HybridCache provides (cache-hit)
//   C) Cache key formation includes IncludeInactive

using AutoMapper;

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Competitions.DTOs;
using BjjEire.Application.Features.Competitions.Queries;
using BjjEire.Domain.Entities.Competitions;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Features.Competitions.Queries;

[Trait("Feature", "Competitions")]
[Trait("Category", "Unit")]
public sealed class GetCompetitionPaginationQueryHandlerTests
{
    private readonly Mock<IRepository<Competition>> _repoMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly Mock<HybridCache> _cacheMock = new();
    private readonly Mock<IUriService> _uriServiceMock = new();
    private readonly TimeProvider _timeProvider = TimeProvider.System;
    private readonly Mock<ILogger<GetCompetitionPaginationQueryHandler>> _loggerMock = new();

    private GetCompetitionPaginationQueryHandler BuildHandler() =>
        new(_repoMock.Object, _mapperMock.Object, _cacheMock.Object,
            _uriServiceMock.Object, _timeProvider, _loggerMock.Object);

    private static PagedResponse<CompetitionDto> BuildCachedResponse(int count = 1)
    {
        List<CompetitionDto> items = Enumerable.Range(0, count)
            .Select(i => new CompetitionDto
            {
                Id = ObjectIds.Valid1,
                Slug = $"competition-{i}",
                Name = $"Competition {i}",
                Organisation = "Test Org",
                Country = "Ireland",
                WebsiteUrl = "https://www.testcomp.ie",
                StartDate = DateTime.UtcNow.AddDays(7),
                EndDate = DateTime.UtcNow.AddDays(8),
                IsActive = true
            })
            .ToList();

        return new PagedResponse<CompetitionDto>
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

    private void SetupCacheHit(PagedResponse<CompetitionDto> response, Action<string>? onKey = null)
    {
        _cacheMock
            .Setup(h => h.GetOrCreateAsync<Func<CancellationToken, ValueTask<PagedResponse<CompetitionDto>>>, PagedResponse<CompetitionDto>>(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<PagedResponse<CompetitionDto>>>>(),
                It.IsAny<Func<Func<CancellationToken, ValueTask<PagedResponse<CompetitionDto>>>, CancellationToken, ValueTask<PagedResponse<CompetitionDto>>>>(),
                It.IsAny<HybridCacheEntryOptions?>(),
                It.IsAny<IEnumerable<string>?>(),
                It.IsAny<CancellationToken>()))
            .Callback<string,
                Func<CancellationToken, ValueTask<PagedResponse<CompetitionDto>>>,
                Func<Func<CancellationToken, ValueTask<PagedResponse<CompetitionDto>>>, CancellationToken, ValueTask<PagedResponse<CompetitionDto>>>,
                HybridCacheEntryOptions?,
                IEnumerable<string>?,
                CancellationToken>((key, _, _, _, _, _) => onKey?.Invoke(key))
            .Returns(new ValueTask<PagedResponse<CompetitionDto>>(response));
    }

    [Fact]
    public async Task Handle_NullRequest_ThrowsArgumentNullException()
    {
        GetCompetitionPaginationQueryHandler handler = BuildHandler();

        await Should.ThrowAsync<ArgumentNullException>(
            () => handler.Handle(null!, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_CacheHit_ReturnsCachedData()
    {
        PagedResponse<CompetitionDto> expected = BuildCachedResponse(3);
        SetupCacheHit(expected);

        PagedResponse<CompetitionDto> result = await BuildHandler().Handle(
            new GetCompetitionPaginationQuery { Page = 1, PageSize = 20 }, CancellationToken.None);

        result.ShouldNotBeNull();
        result.Data.Count.ShouldBe(3);
        result.Pagination.TotalItems.ShouldBe(3);
    }

    [Fact]
    public async Task Handle_CacheHit_DataReferenceFlowsThrough()
    {
        PagedResponse<CompetitionDto> expected = BuildCachedResponse(1);
        SetupCacheHit(expected);

        PagedResponse<CompetitionDto> result = await BuildHandler().Handle(new GetCompetitionPaginationQuery(), CancellationToken.None);

        result.Data.ShouldBeSameAs(expected.Data);
    }

    [Fact]
    public async Task Handle_CacheHit_EmptyResult_ReturnsEmptyData()
    {
        PagedResponse<CompetitionDto> expected = BuildCachedResponse(0);
        SetupCacheHit(expected);

        PagedResponse<CompetitionDto> result = await BuildHandler().Handle(new GetCompetitionPaginationQuery(), CancellationToken.None);

        result.Data.ShouldBeEmpty();
        result.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task Handle_CacheKeyIncludesIncludeInactive()
    {
        string? capturedKey = null;
        SetupCacheHit(BuildCachedResponse(1), key => capturedKey = key);

        await BuildHandler().Handle(
            new GetCompetitionPaginationQuery { Page = 1, PageSize = 20, IncludeInactive = true }, CancellationToken.None);

        capturedKey.ShouldNotBeNullOrEmpty();
        capturedKey.ShouldContain("True", Case.Insensitive);
    }

    [Fact]
    public async Task Handle_DefaultQuery_CacheKeyIncludesIncludeInactiveFalse()
    {
        string? capturedKey = null;
        SetupCacheHit(BuildCachedResponse(0), key => capturedKey = key);

        await BuildHandler().Handle(new GetCompetitionPaginationQuery(), CancellationToken.None);

        capturedKey.ShouldNotBeNullOrEmpty();
        capturedKey.ShouldContain("False", Case.Insensitive);
    }
}
