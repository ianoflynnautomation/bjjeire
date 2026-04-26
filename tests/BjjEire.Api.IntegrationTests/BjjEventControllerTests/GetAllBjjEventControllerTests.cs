// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Net;

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Application.Features.BjjEvents.Queries;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Enums;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.BjjEventControllerTests;

[Collection(BjjEventApiCollection.Name)]
[Trait("Feature", "BjjEvents")]
[Trait("Category", "Integration")]
public class GetAllBjjEventControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ApiIntegrationTestBase(fixture, output)
{
    [Fact]
    public async Task GetAllBjjEvents_WhenNoEventsExist_ShouldReturnOkAndEmptyListAsync()
    {
        // Arrange
        HttpResponseMessage response = await HttpClient.GetAsync("api/bjjevent");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<BjjEventDto> pagedResponse = await ReadJsonAsync<PagedResponse<BjjEventDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Data.ShouldBeEmpty();
        pagedResponse.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task GetAllBjjEvents_AnonymousAccess_ShouldReturn200Async()
    {
        // Arrange
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("api/bjjevent");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAllBjjEvents_WhenEventsExist_ShouldExcludeCompletedEventsAsync()
    {
        // Arrange
        BjjEvent completedEvent = BjjEventTestDataFactory.CreateBjjEvent(e => e.Status = EventStatus.Completed);
        BjjEvent upcomingEvent1 = BjjEventTestDataFactory.CreateBjjEvent(e => e.Status = EventStatus.Upcoming);
        BjjEvent upcomingEvent2 = BjjEventTestDataFactory.CreateBjjEvent(e => e.Status = EventStatus.Upcoming);
        await Database.SeedEntitiesAsync(completedEvent, upcomingEvent1, upcomingEvent2);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("api/bjjevent");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<BjjEventDto> pagedResponse = await ReadJsonAsync<PagedResponse<BjjEventDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);
        pagedResponse.Data.ShouldAllBe(e => e.Status != EventStatus.Completed);
    }

    [Fact]
    public async Task GetAllBjjEvents_WithCountyFilter_ShouldReturnOnlyEventsFromThatCountyAsync()
    {
        // Arrange
        BjjEvent corkEvent1 = BjjEventTestDataFactory.CreateBjjEvent(e => e.County = County.Cork);
        BjjEvent corkEvent2 = BjjEventTestDataFactory.CreateBjjEvent(e => e.County = County.Cork);
        BjjEvent dublinEvent = BjjEventTestDataFactory.CreateBjjEvent(e => e.County = County.Dublin);
        await Database.SeedEntitiesAsync(corkEvent1, corkEvent2, dublinEvent);
        GetBjjEventPaginationQuery query = new()
        { County = County.Cork, Page = 1, PageSize = 20 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"api/bjjevent?county={query.County}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<BjjEventDto> pagedResponse = await ReadJsonAsync<PagedResponse<BjjEventDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);
        pagedResponse.Data.ShouldAllBe(e => e.County == County.Cork);
    }

    [Fact]
    public async Task GetAllBjjEvents_WithTypeFilter_ShouldReturnOnlyEventsOfThatTypeAsync()
    {
        // Arrange
        BjjEvent seminar1 = BjjEventTestDataFactory.CreateBjjEvent(e => e.Type = BjjEventType.Seminar);
        BjjEvent seminar2 = BjjEventTestDataFactory.CreateBjjEvent(e => e.Type = BjjEventType.Seminar);
        BjjEvent camp = BjjEventTestDataFactory.CreateBjjEvent(e => e.Type = BjjEventType.Camp);
        await Database.SeedEntitiesAsync(seminar1, seminar2, camp);
        GetBjjEventPaginationQuery query = new()
        { Type = BjjEventType.Seminar, Page = 1, PageSize = 20 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"api/bjjevent?type={query.Type}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<BjjEventDto> pagedResponse = await ReadJsonAsync<PagedResponse<BjjEventDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);
        pagedResponse.Data.ShouldAllBe(e => e.Type == BjjEventType.Seminar);
    }

    [Fact]
    public async Task GetAllBjjEvents_WithCountyAndTypeFilter_ShouldReturnCorrectSubsetAsync()
    {
        // Arrange
        BjjEvent corkSeminar = BjjEventTestDataFactory.CreateBjjEvent(e => { e.County = County.Cork; e.Type = BjjEventType.Seminar; });
        BjjEvent corkCamp = BjjEventTestDataFactory.CreateBjjEvent(e => { e.County = County.Cork; e.Type = BjjEventType.Camp; });
        BjjEvent dublinSeminar = BjjEventTestDataFactory.CreateBjjEvent(e => { e.County = County.Dublin; e.Type = BjjEventType.Seminar; });
        await Database.SeedEntitiesAsync(corkSeminar, corkCamp, dublinSeminar);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("api/bjjevent?county=Cork&type=Seminar");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<BjjEventDto> pagedResponse = await ReadJsonAsync<PagedResponse<BjjEventDto>>(response);
        pagedResponse.Data.Count.ShouldBe(1);
        pagedResponse.Pagination.TotalItems.ShouldBe(1);
    }

    [Fact]
    public async Task GetAllBjjEvents_WithPagination_ShouldRespectPageSizeAndNumberAsync()
    {
        // Arrange
        BjjEvent[] events = Enumerable.Range(1, 5).Select(_ => BjjEventTestDataFactory.CreateBjjEvent()).ToArray();
        await Database.SeedEntitiesAsync(events);
        GetBjjEventPaginationQuery query = new()
        { Page = 2, PageSize = 2 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"api/bjjevent?page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<BjjEventDto> pagedResponse = await ReadJsonAsync<PagedResponse<BjjEventDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(5);
        pagedResponse.Pagination.CurrentPage.ShouldBe(2);
        pagedResponse.Pagination.PageSize.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeTrue();
        pagedResponse.Pagination.HasPreviousPage.ShouldBeTrue();
    }

    [Fact]
    public async Task GetAllBjjEvents_WhenOnLastPage_ShouldHaveHasNextPageFalseAsync()
    {
        // Arrange
        BjjEvent[] events = Enumerable.Range(1, 4).Select(_ => BjjEventTestDataFactory.CreateBjjEvent()).ToArray();
        await Database.SeedEntitiesAsync(events);
        GetBjjEventPaginationQuery query = new()
        { Page = 2, PageSize = 2 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"api/bjjevent?page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<BjjEventDto> pagedResponse = await ReadJsonAsync<PagedResponse<BjjEventDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalPages.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeFalse();
        pagedResponse.Pagination.HasPreviousPage.ShouldBeTrue();
    }

    [Fact]
    public async Task GetAllBjjEvents_WithPageSizeLargerThanTotalItems_ShouldReturnAllItemsAsync()
    {
        // Arrange
        BjjEvent[] events = Enumerable.Range(1, 3).Select(_ => BjjEventTestDataFactory.CreateBjjEvent()).ToArray();
        await Database.SeedEntitiesAsync(events);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("api/bjjevent?pageSize=10");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<BjjEventDto> pagedResponse = await ReadJsonAsync<PagedResponse<BjjEventDto>>(response);
        pagedResponse.Data.Count.ShouldBe(3);
        pagedResponse.Pagination.TotalItems.ShouldBe(3);
        pagedResponse.Pagination.HasNextPage.ShouldBeFalse();
    }

    [Theory]
    [InlineData("page=0")]
    [InlineData("page=-1")]
    public async Task GetAllBjjEvents_WithInvalidPageNumber_ShouldUseDefaultPageNumberAsync(string invalidPageQuery)
    {
        // Arrange
        await Database.SeedEntitiesAsync(BjjEventTestDataFactory.CreateBjjEvent());

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"api/bjjevent?{invalidPageQuery}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<BjjEventDto> pagedResponse = await ReadJsonAsync<PagedResponse<BjjEventDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Pagination.CurrentPage.ShouldBe(1);
    }

    [Theory]
    [InlineData("pageSize=0")]
    [InlineData("pageSize=-1")]
    [InlineData("pageSize=101")]
    public async Task GetAllBjjEvents_WithInvalidPageSize_ShouldUseDefaultPageSizeAsync(string invalidPageSizeQuery)
    {
        // Arrange
        BjjEvent[] events = Enumerable.Range(1, 25).Select(_ => BjjEventTestDataFactory.CreateBjjEvent()).ToArray();
        await Database.SeedEntitiesAsync(events);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"api/bjjevent?{invalidPageSizeQuery}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<BjjEventDto> pagedResponse = await ReadJsonAsync<PagedResponse<BjjEventDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Pagination.PageSize.ShouldBe(20);
        pagedResponse.Data.Count.ShouldBe(20);
    }

    [Fact]
    public async Task GetAllBjjEvents_WithFilterThatHasNoMatches_ShouldReturnOkAndEmptyListAsync()
    {
        // Arrange
        await Database.SeedEntitiesAsync(BjjEventTestDataFactory.CreateBjjEvent(e => e.County = County.Dublin));

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("api/bjjevent?county=Cork");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<BjjEventDto> pagedResponse = await ReadJsonAsync<PagedResponse<BjjEventDto>>(response);
        pagedResponse.Data.ShouldBeEmpty();
        pagedResponse.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task GetAllBjjEvents_WithFilterAndPagination_ShouldReturnCorrectSubsetAsync()
    {
        // Arrange
        BjjEvent[] corkSeminars = Enumerable.Range(1, 5).Select(i => BjjEventTestDataFactory.CreateBjjEvent(e =>
        {
            e.County = County.Cork;
            e.Type = BjjEventType.Seminar;
        })).ToArray();
        BjjEvent dublinSeminar = BjjEventTestDataFactory.CreateBjjEvent(e => { e.County = County.Dublin; e.Type = BjjEventType.Seminar; });
        await Database.SeedEntitiesAsync(corkSeminars);
        await Database.SeedEntitiesAsync(dublinSeminar);
        GetBjjEventPaginationQuery query = new()
        { County = County.Cork, Type = BjjEventType.Seminar, Page = 2, PageSize = 3 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"api/bjjevent?county={query.County}&type={query.Type}&page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<BjjEventDto> pagedResponse = await ReadJsonAsync<PagedResponse<BjjEventDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(5);
        pagedResponse.Pagination.CurrentPage.ShouldBe(2);
    }
}
