// using AutoMapper;
// using BjjEire.Application.Common.Constants;
// using BjjEire.Application.Common.DTOs;
// using BjjEire.Application.Common.Interfaces;
// using BjjEire.Application.Features.Gyms.Constants;
// using BjjEire.Application.Features.Gyms.DTOs;
// using BjjEire.Application.Features.Gyms.Queries;
// using BjjEire.Domain.Entities;
// using BjjEire.Domain.Entities.Common;
// using BjjEire.Domain.Entities.Gyms;
// using BjjEire.Domain.Enums;
// using Microsoft.AspNetCore.Routing;
// using MongoDB.Driver;
// using MongoDB.Driver.Linq;
// using Moq;
// using NUnit.Framework;
// using Shouldly;

// namespace BjjEire.Application.UnitTests.Features.Gyms.Queries;

// [TestFixture]
// public class GetGymPaginationQueryHandlerTests {
//     private Mock<IRepository<Gym>> _gymRepositoryMock;
//     private IMapper _mapper;
//     private Mock<ICacheBase> _cacheMock;
//     private Mock<ILinkService> _linkServiceMock;
//     private GetGymPaginationQueryHandler _handler;
//     private Mock<IPaginationService> _paginationServiceMock;
//     private static readonly DateTime FixedTestTime = new(2024, 01, 01, 12, 0, 0, DateTimeKind.Utc);

//     [SetUp]
//     public void Setup() {
//         _gymRepositoryMock = new Mock<IRepository<Gym>>();
//         _cacheMock = new Mock<ICacheBase>();
//         _linkServiceMock = new Mock<ILinkService>();
//         _paginationServiceMock = new Mock<IPaginationService>();

//         // Include all mapping profiles
//         var config = new MapperConfiguration(cfg => {
//             cfg.AddProfile<GymtDtoMapping>();
//             cfg.AddProfile<AffiliationDtoMapping>();
//             cfg.AddProfile<TrialOfferDtoMapping>();
//             cfg.AddProfile<SocialMediaMapping>();
//             _ = cfg.CreateMap<Location, LocationDto>()
//                 .ForMember(dest => dest.Address, mo => mo.MapFrom(src => src.Address ?? string.Empty))
//                 .ForMember(dest => dest.Venue, mo => mo.MapFrom(src => src.Venue ?? string.Empty))
//                 .ForMember(dest => dest.Coordinates, mo => mo.MapFrom(src => src.Coordinates != null ? new GeoCoordinatesDto {
//                     Type = src.Coordinates.Type,
//                     Latitude = src.Coordinates.Latitude,
//                     Longitude = src.Coordinates.Longitude,
//                     PlaceName = src.Coordinates.PlaceName,
//                     PlaceId = src.Coordinates.PlaceId
//                 } : null));
//             _ = cfg.CreateMap<GeoCoordinates, GeoCoordinatesDto>();
//             _ = cfg.CreateMap<GeoCoordinatesDto, GeoCoordinates>();
//         });
//         _mapper = config.CreateMapper();

//         _handler = new GetGymPaginationQueryHandler(
//             _gymRepositoryMock.Object,
//             _mapper,
//             _cacheMock.Object,
//             _linkServiceMock.Object,
//             _paginationServiceMock.Object);
//     }


//     private static List<Gym> GetSampleGyms() {
//         return
//         [
//             new Gym { Id = "gym1", Name = "AAA First Gym", Status = GymStatus.Active, County = "Dublin", Description = "Desc1", CreatedOnUtc = FixedTestTime, UpdatedOnUtc = FixedTestTime, Location = new Location(), Affiliation = new Affiliation(), TrialOffer = new TrialOffer(), SocialMedia = new SocialMedia() },
//             new Gym { Id = "gym2", Name = "BBB Second Gym", Status = GymStatus.Active, County = "Cork", Description = "Desc2", CreatedOnUtc = FixedTestTime, UpdatedOnUtc = FixedTestTime, Location = new Location(), Affiliation = new Affiliation(), TrialOffer = new TrialOffer(), SocialMedia = new SocialMedia() },
//             new Gym { Id = "gym3", Name = "CCC Third Gym", Status = GymStatus.Active, County = "Dublin", Description = "Desc3", CreatedOnUtc = FixedTestTime, UpdatedOnUtc = FixedTestTime, Location = new Location(), Affiliation = new Affiliation(), TrialOffer = new TrialOffer(), SocialMedia = new SocialMedia() },
//             new Gym { Id = "gym4", Name = "DDD Fourth Gym (Inactive)", Status = GymStatus.OpeningSoon, County = "Galway", Description = "Desc4", CreatedOnUtc = FixedTestTime, UpdatedOnUtc = FixedTestTime, Location = new Location(), Affiliation = new Affiliation(), TrialOffer = new TrialOffer(), SocialMedia = new SocialMedia() },
//             new Gym { Id = "gym5", Name = "EEE Fifth Gym", Status = GymStatus.Active, County = "Cork", Description = "Desc5", CreatedOnUtc = FixedTestTime, UpdatedOnUtc = FixedTestTime, Location = new Location(), Affiliation = new Affiliation(), TrialOffer = new TrialOffer(), SocialMedia = new SocialMedia() }
//         ];
//         // This provides 4 Active gyms: AAA, BBB, CCC, EEE
//         // Sorted by name: AAA First Gym, BBB Second Gym, CCC Third Gym, EEE Fifth Gym
//     }

//     // [Test]
//     // public void Constructor_ShouldThrowArgumentNullException_WhenMapperIsNull() {
//     //     Should.Throw<ArgumentNullException>(() =>
//     //         new GetGymPaginationQueryHandler(_gymRepositoryMock.Object, null!, _cacheMock.Object, _linkServiceMock.Object)
//     //     ).ParamName.ShouldBe("mapper");
//     // }

//     // [Test]
//     // public void Constructor_ShouldThrowArgumentNullException_WhenCacheBaseIsNull() {
//     //     Should.Throw<ArgumentNullException>(() =>
//     //        new GetGymPaginationQueryHandler(_gymRepositoryMock.Object, _mapperMock.Object, null!, _linkServiceMock.Object)
//     //    ).ParamName.ShouldBe("cacheBase");
//     // }

//     // [Test]
//     // public void Constructor_ShouldThrowArgumentNullException_WhenLinkServiceIsNull() {
//     //     Should.Throw<ArgumentNullException>(() =>
//     //         new GetGymPaginationQueryHandler(_gymRepositoryMock.Object, _mapperMock.Object, _cacheMock.Object, null!)
//     //     ).ParamName.ShouldBe("linkService");
//     // }

//     // [Test]
//     // public void Handle_WhenRequestIsNull_ThrowsArgumentNullException()
//     //     => _ = Should.ThrowAsync<ArgumentNullException>(() => _handler.Handle(null, CancellationToken.None));

//     [Test]
//     public async Task Handle_WhenCacheHit_ReturnsCachedResponse() {
//         // Arrange
//         var request = new GetGymPaginationQuery { Page = 1, PageSize = 10, County = null };
//         var cachedData = new List<GymDto> { new() { Name = "Cached Gym 1" } };
//         var cachedPagination = new PaginationMetadataDto { TotalItems = 1, CurrentPage = 1, PageSize = 10, TotalPages = 1 };
//         var cachedResponse = new GetGymPaginatedResponse { Data = cachedData, Pagination = cachedPagination };
//         var cacheKey = CacheKey.AllGyms(request.Page, request.PageSize, request.County);

//         _ = _cacheMock.Setup(c => c.GetAsync<GetGymPaginatedResponse>(cacheKey, It.IsAny<Func<Task<GetGymPaginatedResponse>>>()))
//             .ReturnsAsync(cachedResponse);

//         // Act
//         var result = await _handler.Handle(request, CancellationToken.None);

//         // Assert
//         result.ShouldBeSameAs(cachedResponse);
//         _gymRepositoryMock.Verify(r => r.Table, Times.Never());
//         _paginationServiceMock.Verify(s => s.CreatePagedListAsync(
//             It.IsAny<IQueryable<GymDto>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
//         _linkServiceMock.Verify(l => l.GeneratePaginationUrls(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<RouteValueDictionary>()), Times.Never);
//         _cacheMock.Verify(c => c.GetAsync<GetGymPaginatedResponse>(cacheKey, It.IsAny<Func<Task<GetGymPaginatedResponse>>>()), Times.Once());
//     }

//     [Test]
//     public Task Handle_WhenDataNotInCache_NoCountyFilter_FirstPage_ShouldFetchAndPaginate() {
//         var request = new GetGymPaginationQuery { Page = 1, PageSize = 2, County = null }; // 4 active gyms, PageSize 2 => 2 pages
//         return Test_Handle_WhenDataNotInCache_Scenario(
//             request,
//             GetSampleGyms(),
//             gym => gym.Status == GymStatus.Active,
//             query => query.OrderBy(g => g.Name)
//         );
//         // Expected: AAA, BBB on page 1. HasNextPage = true, HasPreviousPage = false.
//     }

//     [Test]
//     public Task Handle_WhenDataNotInCache_NoCountyFilter_LastPage_ShouldFetchAndPaginate() {
//         var request = new GetGymPaginationQuery { Page = 2, PageSize = 2, County = null }; // 4 active gyms, PageSize 2 => 2 pages
//         return Test_Handle_WhenDataNotInCache_Scenario(
//             request,
//             GetSampleGyms(),
//             gym => gym.Status == GymStatus.Active,
//             query => query.OrderBy(g => g.Name)
//         );
//         // Expected: CCC, EEE on page 2. HasNextPage = false, HasPreviousPage = true.
//     }

//     [Test]
//     public Task Handle_WhenDataNotInCache_NoCountyFilter_PageExceedsTotal_ShouldReturnEmptyDataForPage() {
//         var request = new GetGymPaginationQuery { Page = 3, PageSize = 2, County = null }; // Requesting page 3, but only 2 pages exist
//         return Test_Handle_WhenDataNotInCache_Scenario(
//             request,
//             GetSampleGyms(),
//             gym => gym.Status == GymStatus.Active,
//             query => query.OrderBy(g => g.Name)
//         );
//         // Expected: Empty data list. TotalItems = 4, TotalPages = 2. HasNextPage = false, HasPreviousPage = true (relative to valid page range).
//     }

//     [Test]
//     public Task Handle_WhenDataNotInCache_WithCountyFilter_ShouldFetchFilteredAndPaginatedData() {
//         var request = new GetGymPaginationQuery { Page = 1, PageSize = 1, County = "Dublin" };
//         // Active Dublin gyms sorted: AAA First Gym, CCC Third Gym
//         return Test_Handle_WhenDataNotInCache_Scenario(
//             request,
//             GetSampleGyms(),
//             gym => gym.Status == GymStatus.Active && gym.County == "Dublin",
//             query => query.OrderBy(g => g.Name)
//         );
//         // Expected: AAA First Gym on page 1. TotalItems for "Dublin" = 2, TotalPages = 2. HasNextPage = true.
//     }

//     [Test]
//     public Task Handle_WhenDataNotInCache_NoActiveGyms_ShouldReturnEmptyResultAndCorrectPagination() {
//         var request = new GetGymPaginationQuery { Page = 1, PageSize = 10, County = null };
//         var noActiveGyms = GetSampleGyms().Select(g => { g.Status = GymStatus.PermanentlyClosed; return g; }).ToList(); // Make all gyms inactive

//         return Test_Handle_WhenDataNotInCache_Scenario(
//             request,
//             noActiveGyms,
//             gym => gym.Status == GymStatus.Active, // This will yield 0 items
//             query => query.OrderBy(g => g.Name)
//         );
//         // Expected: Empty data. TotalItems = 0, TotalPages = 0. HasNextPage = false, HasPreviousPage = false.
//     }


//     private async Task Test_Handle_WhenDataNotInCache_Scenario(GetGymPaginationQuery request, List<Gym> allGyms, Func<Gym, bool> filterPredicate, Func<IQueryable<Gym>, IOrderedQueryable<Gym>> sortLogic) {
//         // Arrange
//         var expectedCacheKey = CacheKey.AllGyms(request.Page, request.PageSize, request.County);

//         var filteredAndSortedGyms = sortLogic(allGyms.Where(filterPredicate).AsQueryable()).ToList();

//         _ = _gymRepositoryMock.Setup(x => x.Table).Returns(allGyms.AsQueryable());

//         // Simulate what the pagination service would return
//         int pageIndex = request.Page > 0 ? request.Page - 1 : 0;
//         var itemsForCurrentPage = filteredAndSortedGyms
//             .Skip(pageIndex * request.PageSize)
//             .Take(request.PageSize)
//             .ToList();
//         var dtosForCurrentPage = _mapper.Map<List<GymDto>>(itemsForCurrentPage);

//         var expectedPagedList = new PagedList<GymDto>(
//             dtosForCurrentPage,
//             filteredAndSortedGyms.Count,
//             pageIndex,
//             request.PageSize
//         );

//         _ = _paginationServiceMock
//             .Setup(s => s.CreatePagedListAsync(
//                 It.IsAny<IQueryable<GymDto>>(), // Can make this more specific if needed
//                 pageIndex,
//                 request.PageSize,
//                 It.IsAny<CancellationToken>()))
//             .ReturnsAsync(expectedPagedList);

//         _ = _cacheMock.Setup(c => c.GetAsync<GetGymPaginatedResponse>(
//                  expectedCacheKey,
//                  It.IsAny<Func<Task<GetGymPaginatedResponse>>>()))
//              .Returns<string, Func<Task<GetGymPaginatedResponse>>>(async (key, factory) => await factory());

//         string mockNextPageUrl = expectedPagedList.HasNextPage ? $"nextPage_p{request.Page + 1}" : null;
//         string mockPrevPageUrl = expectedPagedList.HasPreviousPage ? $"prevPage_p{request.Page - 1}" : null;

// #pragma warning disable CS8602 // Dereference of a possibly null reference.
//         _ = _linkServiceMock.Setup(l => l.GeneratePaginationUrls(
//                 GymsApiConstants.ControllerName,
//                 GymsApiConstants.GetAllActionName,
//                 request.Page,
//                 expectedPagedList.PageSize,
//                 expectedPagedList.TotalPages,
//                 expectedPagedList.HasNextPage,
//                 expectedPagedList.HasPreviousPage,
//                 It.Is<RouteValueDictionary>(rvd => (request.County == null && !rvd.ContainsKey("county")) || (request.County != null && rvd["county"].ToString() == request.County))))
//             .Returns((mockNextPageUrl, mockPrevPageUrl));
// #pragma warning restore CS8602 // Dereference of a possibly null reference.

//         // Act
//         var result = await _handler.Handle(request, CancellationToken.None);

//         // Assert
//         _ = result.ShouldNotBeNull();
//         result.Data.Count.ShouldBe(expectedPagedList.Count);

//         for (int i = 0; i < expectedPagedList.Count; i++) {
//             result.Data[i].Id.ShouldBe(dtosForCurrentPage[i].Id);
//             result.Data[i].Name.ShouldBe(dtosForCurrentPage[i].Name);
//             // Add more detailed property assertions if necessary
//         }

//         _ = result.Pagination.ShouldNotBeNull();
//         result.Pagination.CurrentPage.ShouldBe(request.Page);
//         result.Pagination.PageSize.ShouldBe(expectedPagedList.PageSize);
//         result.Pagination.TotalItems.ShouldBe(expectedPagedList.TotalCount);
//         result.Pagination.TotalPages.ShouldBe(expectedPagedList.TotalPages);
//         result.Pagination.HasNextPage.ShouldBe(expectedPagedList.HasNextPage);
//         result.Pagination.HasPreviousPage.ShouldBe(expectedPagedList.HasPreviousPage);
//         result.Pagination.NextPageUrl.ShouldBe(mockNextPageUrl);
//         result.Pagination.PreviousPageUrl.ShouldBe(mockPrevPageUrl);

//         // Verify mocks
//         _cacheMock.Verify(c => c.GetAsync<GetGymPaginatedResponse>(expectedCacheKey, It.IsAny<Func<Task<GetGymPaginatedResponse>>>()), Times.Once());
//         _gymRepositoryMock.Verify(r => r.Table, Times.Once());
//         _paginationServiceMock.Verify(s => s.CreatePagedListAsync(
//             It.IsAny<IQueryable<GymDto>>(), pageIndex, request.PageSize, It.IsAny<CancellationToken>()), Times.Once());
// #pragma warning disable CS8602 // Dereference of a possibly null reference.
//         _linkServiceMock.Verify(l => l.GeneratePaginationUrls(
//             GymsApiConstants.ControllerName, GymsApiConstants.GetAllActionName, request.Page,
//             expectedPagedList.PageSize, expectedPagedList.TotalPages, expectedPagedList.HasNextPage, expectedPagedList.HasPreviousPage,
//             It.Is<RouteValueDictionary>(rvd => (request.County == null && !rvd.ContainsKey("county")) || (request.County != null && rvd["county"].ToString() == request.County))), Times.Once());
// #pragma warning restore CS8602 // Dereference of a possibly null reference.
//     }
// }