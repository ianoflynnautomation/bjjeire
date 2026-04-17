// Tests for CachedPaginatedQueryHandler<TEntity, TDto, TRequest>.
//
// The base handler owns the read-through cache + logging shape that today is
// copy-pasted into every Get{Foo}PaginationQueryHandler. These tests verify
// that shape directly against a fake subclass, so the per-feature handlers
// can be collapsed to template-method overrides without losing coverage.

using AutoMapper;

using BjjEire.Application.Common;
using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Common.Queries;
using BjjEire.Domain.Entities;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Shouldly;

namespace BjjEire.Application.UnitTests.Common.Queries;

[Trait("Feature", "Common")]
[Trait("Category", "Unit")]
public sealed class CachedPaginatedQueryHandlerTests
{
    private readonly Mock<IRepository<FakeEntity>> _repoMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly Mock<HybridCache> _cacheMock = new();
    private readonly Mock<IUriService> _uriServiceMock = new();

    private FakeHandler BuildHandler(
        Func<FakeRequest, string>? cacheKey = null,
        Func<IQueryable<FakeEntity>, FakeRequest, IQueryable<FakeEntity>>? applyFilters = null) =>
        new(_repoMock.Object, _mapperMock.Object, _cacheMock.Object, _uriServiceMock.Object)
        {
            CacheKeyFn = cacheKey ?? (r => $"fake_p{r.Page}_s{r.PageSize}"),
            ApplyFiltersFn = applyFilters ?? ((q, _) => q),
        };

    private static PagedResponse<FakeDto> CachedResponse(int count = 1) =>
        new()
        {
            Data = Enumerable.Range(0, count).Select(i => new FakeDto { Id = i }).ToList(),
            Pagination = new PaginationMetadataDto
            {
                TotalItems = count,
                CurrentPage = 1,
                PageSize = 20,
                TotalPages = 1,
            },
        };

    // HybridCache.GetOrCreateAsync<T> (no-state overload) is a non-virtual wrapper
    // that calls the abstract GetOrCreateAsync<TState, T> with
    // TState = Func<CancellationToken, ValueTask<T>>. Moq can only intercept the
    // abstract overload, so we match that shape explicitly.
    private void SetupCacheHit(PagedResponse<FakeDto> response, Action<string, IEnumerable<string>?>? onInvoke = null) =>
        _cacheMock
            .Setup(h => h.GetOrCreateAsync<Func<CancellationToken, ValueTask<PagedResponse<FakeDto>>>, PagedResponse<FakeDto>>(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<PagedResponse<FakeDto>>>>(),
                It.IsAny<Func<Func<CancellationToken, ValueTask<PagedResponse<FakeDto>>>, CancellationToken, ValueTask<PagedResponse<FakeDto>>>>(),
                It.IsAny<HybridCacheEntryOptions?>(),
                It.IsAny<IEnumerable<string>?>(),
                It.IsAny<CancellationToken>()))
            .Callback<string,
                Func<CancellationToken, ValueTask<PagedResponse<FakeDto>>>,
                Func<Func<CancellationToken, ValueTask<PagedResponse<FakeDto>>>, CancellationToken, ValueTask<PagedResponse<FakeDto>>>,
                HybridCacheEntryOptions?,
                IEnumerable<string>?,
                CancellationToken>((key, _, _, _, tags, _) => onInvoke?.Invoke(key, tags))
            .Returns(new ValueTask<PagedResponse<FakeDto>>(response));

    [Fact]
    public async Task Handle_NullRequest_ThrowsArgumentNullException()
    {
        FakeHandler handler = BuildHandler();

        await Should.ThrowAsync<ArgumentNullException>(
            () => handler.Handle(null!, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_CacheHit_ReturnsCachedData()
    {
        PagedResponse<FakeDto> expected = CachedResponse(3);
        SetupCacheHit(expected);

        PagedResponse<FakeDto> result = await BuildHandler().Handle(
            new FakeRequest { Page = 1, PageSize = 20 }, CancellationToken.None);

        result.Data.ShouldBeSameAs(expected.Data);
        result.Data.Count.ShouldBe(3);
    }

    [Fact]
    public async Task Handle_UsesCacheKeyFromSubclass()
    {
        string? captured = null;
        SetupCacheHit(CachedResponse(), onInvoke: (key, _) => captured = key);

        await BuildHandler(cacheKey: r => $"custom::{r.Page}::{r.PageSize}")
            .Handle(new FakeRequest { Page = 2, PageSize = 50 }, CancellationToken.None);

        captured.ShouldBe("custom::2::50");
    }

    [Fact]
    public async Task Handle_PassesSubclassCacheTagToHybridCache()
    {
        IEnumerable<string>? capturedTags = null;
        SetupCacheHit(CachedResponse(), onInvoke: (_, tags) => capturedTags = tags);

        await BuildHandler().Handle(new FakeRequest(), CancellationToken.None);

        capturedTags.ShouldNotBeNull();
        capturedTags.ShouldContain(FakeHandler.Tag);
    }

    [Fact]
    public async Task Handle_HasNextPage_CallsUriServiceForNavigationLinks()
    {
        PagedResponse<FakeDto> cached = new()
        {
            Data = [],
            Pagination = new PaginationMetadataDto
            {
                TotalItems = 40,
                CurrentPage = 1,
                PageSize = 20,
                TotalPages = 2,
                HasNextPage = true,
                HasPreviousPage = false,
            },
        };
        SetupCacheHit(cached);
        _uriServiceMock.Setup(u => u.GetPageUri(It.IsAny<PaginationFilter>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IDictionary<string, object?>?>()))
            .Returns("https://api.test/fake?page=2&pageSize=20");

        PagedResponse<FakeDto> result = await BuildHandler().Handle(new FakeRequest(), CancellationToken.None);

        result.Pagination.NextPageUrl.ShouldBe("https://api.test/fake?page=2&pageSize=20");
        _uriServiceMock.Verify(u => u.GetPageUri(It.IsAny<PaginationFilter>(), "FakeController", "GetAll", It.IsAny<IDictionary<string, object?>?>()), Times.Once);
    }

    // ─── Fakes used to exercise the base class ──────────────────────────────

    public sealed class FakeEntity : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
    }

    public sealed class FakeDto
    {
        public int Id { get; set; }
    }

    public sealed record FakeRequest : BasePaginationQuery, MediatR.IRequest<PagedResponse<FakeDto>>;

    public sealed class FakeHandler(
        IRepository<FakeEntity> repository,
        IMapper mapper,
        HybridCache hybridCache,
        IUriService uriService)
        : CachedPaginatedQueryHandler<FakeEntity, FakeDto, FakeRequest>(
            repository, mapper, hybridCache, uriService, NullLogger.Instance)
    {
        public const string Tag = "fake-tag";

        public required Func<FakeRequest, string> CacheKeyFn { get; init; }
        public required Func<IQueryable<FakeEntity>, FakeRequest, IQueryable<FakeEntity>> ApplyFiltersFn { get; init; }

        protected override string BuildCacheKey(FakeRequest request) => CacheKeyFn(request);

        protected override string CacheTag => Tag;

        protected override string ControllerName => "FakeController";

        protected override string ActionName => "GetAll";

        protected override IQueryable<FakeEntity> ApplyFilters(IQueryable<FakeEntity> source, FakeRequest request) =>
            ApplyFiltersFn(source, request);

        protected override IOrderedQueryable<FakeEntity> ApplyOrdering(IQueryable<FakeEntity> source, FakeRequest request) =>
            source.OrderBy(x => x.Name);
    }
}
