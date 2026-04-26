// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Net;

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Application.Features.Gyms.Queries;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Enums;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.GymControllerTests;

[Collection(GymApiCollection.Name)]
[Trait("Feature", "Gyms")]
[Trait("Category", "Integration")]
public class GetAllGymsControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ApiIntegrationTestBase(fixture, output)
{

    [Fact]
    public async Task GetAllGyms_AnonymousAccess_ShouldReturn200Async()
    {
        // Arrange — deliberately no auth token
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("/api/v1/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAllGyms_OnlyActiveGymsReturned_AllOtherStatusesExcludedAsync()
    {
        // Arrange
        Gym active = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        Gym pendingApproval = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.PendingApproval);
        Gym temporarilyClosed = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.TemporarilyClosed);
        Gym permanentlyClosed = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.PermanentlyClosed);
        Gym draft = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Draft);
        await Database.SeedEntitiesAsync(active, pendingApproval, temporarilyClosed, permanentlyClosed, draft);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("/api/v1/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<GymDto> pagedResponse = await ReadJsonAsync<PagedResponse<GymDto>>(response);
        pagedResponse.Data.Count.ShouldBe(1);
        pagedResponse.Pagination.TotalItems.ShouldBe(1);
        pagedResponse.Data.ShouldAllBe(g => g.Status == GymStatus.Active);
    }

    [Fact]
    public async Task GetAllGyms_WhenNoGymsExist_ShouldReturnOkAndEmptyListAsync()
    {
        // Arrange & Act
        HttpResponseMessage response = await HttpClient.GetAsync("/api/v1/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<GymDto> pagedResponse = await ReadJsonAsync<PagedResponse<GymDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Data.ShouldBeEmpty();
        pagedResponse.Pagination.TotalItems.ShouldBe(0);

    }

    [Fact]
    public async Task GetAllGyms_WhenGymsExist_ShouldReturnAllActiveGymsAsync()
    {
        // Arrange
        Gym inactiveGym = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.PermanentlyClosed);
        Gym gym1 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        Gym gym2 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        await Database.SeedEntitiesAsync(gym1, gym2, inactiveGym);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("/api/v1/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<GymDto> pagedResponse = await ReadJsonAsync<PagedResponse<GymDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);

    }


    [Fact]
    public async Task GetAllGyms_WithCountyFilter_ShouldReturnOnlyGymsFromThatCountyAsync()
    {
        // Arrange
        Gym gym1 = GymTestDataFactory.CreateGym(g => g.County = County.Cork);
        Gym gym2 = GymTestDataFactory.CreateGym(g => g.County = County.Cork);
        Gym gym3 = GymTestDataFactory.CreateGym(g => g.County = County.Dublin);
        await Database.SeedEntitiesAsync(gym1, gym2, gym3);
        GetGymPaginationQuery query = new()
        { County = County.Cork, Page = 1, PageSize = 20 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"/api/v1/gym?county={query.County}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<GymDto> pagedResponse = await ReadJsonAsync<PagedResponse<GymDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);
        pagedResponse.Pagination.PageSize.ShouldBe(query.PageSize);
        pagedResponse.Pagination.TotalPages.ShouldBe(query.Page);

    }


    [Fact]
    public async Task GetAllGyms_WithPagination_ShouldRespectPageSizeAndNumberAsync()
    {

        // Arrange
        Gym[] gyms = Enumerable.Range(1, 5).Select(_ => GymTestDataFactory.CreateGym()).ToArray();
        await Database.SeedEntitiesAsync(gyms);
        GetGymPaginationQuery query = new()
        { Page = 2, PageSize = 2 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"/api/v1/gym?page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<GymDto> pagedResponse = await ReadJsonAsync<PagedResponse<GymDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(5);
        pagedResponse.Pagination.CurrentPage.ShouldBe(2);
        pagedResponse.Pagination.PageSize.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeTrue();
        pagedResponse.Pagination.HasPreviousPage.ShouldBeTrue();
    }

    [Fact]
    public async Task GetAllGyms_WithPageSizeLargerThanTotalItems_ShouldReturnAllItemsAsync()
    {

        // Arrange
        Gym gym1 = GymTestDataFactory.CreateGym(g => g.County = County.Cork);
        Gym gym2 = GymTestDataFactory.CreateGym(g => g.County = County.Cork);
        await Database.SeedEntitiesAsync(gym1, gym2);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("/api/v1/gym?pageSize=10");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<GymDto> pagedResponse = await ReadJsonAsync<PagedResponse<GymDto>>(response);

        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeFalse();

    }

    [Theory]
    [InlineData("page=0")]
    [InlineData("page=-1")]
    public async Task GetAllGyms_WithInvalidPageNumber_ShouldUseDefaultPageNumberAsync(string invalidPageQuery)
    {

        // Arrange
        await Database.SeedEntitiesAsync(GymTestDataFactory.CreateGym());

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"/api/v1/gym?{invalidPageQuery}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<GymDto> pagedResponse = await ReadJsonAsync<PagedResponse<GymDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Pagination.CurrentPage.ShouldBe(1);

    }

    [Theory]
    [InlineData("pageSize=0")]
    [InlineData("pageSize=-1")]
    [InlineData("pageSize=101")]
    public async Task GetAllGyms_WithInvalidPageSize_ShouldUseDefaultPageSizeAsync(string invalidPageSizeQuery)
    {
        // Arrange
        Gym[] gymsToSeed = Enumerable.Range(1, 25)
            .Select(_ => GymTestDataFactory.CreateGym())
            .ToArray();
        await Database.SeedEntitiesAsync(gymsToSeed);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"/api/v1/gym?{invalidPageSizeQuery}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<GymDto> pagedResponse = await ReadJsonAsync<PagedResponse<GymDto>>(response);

        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Pagination.PageSize.ShouldBe(20);
        pagedResponse.Data.Count.ShouldBe(20);

    }

    [Fact]
    public async Task GetAllGyms_WithFilterAndPagination_ShouldReturnCorrectSubsetAsync()
    {
        // Arrange
        Gym[] gymsInCork = Enumerable.Range(1, 5).Select(i => GymTestDataFactory.CreateGym(g =>
        {
            g.Name = $"Cork Gym {i}";
            g.County = County.Cork;
        })).ToArray();
        await Database.SeedEntitiesAsync(gymsInCork);
        await Database.SeedEntitiesAsync(GymTestDataFactory.CreateGym(g => g.County = County.Dublin));
        GetGymPaginationQuery query = new()
        { County = County.Cork, Page = 2, PageSize = 3 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"/api/v1/gym?county={query.County}&page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<GymDto> pagedResponse = await ReadJsonAsync<PagedResponse<GymDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(5);
        pagedResponse.Pagination.CurrentPage.ShouldBe(2);
    }

    [Fact]
    public async Task GetAllGyms_ShouldReturnGymsSortedByNameAsync()
    {
        // Arrange
        Gym gymC = GymTestDataFactory.CreateGym(g => g.Name = "C-Team Gym");
        Gym gymA = GymTestDataFactory.CreateGym(g => g.Name = "A-Team Gym");
        Gym gymB = GymTestDataFactory.CreateGym(g => g.Name = "B-Team Gym");
        await Database.SeedEntitiesAsync(gymC, gymA, gymB);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("/api/v1/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<GymDto> pagedResponse = await ReadJsonAsync<PagedResponse<GymDto>>(response);
        pagedResponse.Data.Select(g => g.Name).ShouldBe(["A-Team Gym", "B-Team Gym", "C-Team Gym"]);
    }

    [Fact]
    public async Task GetAllGyms_WithFilterThatHasNoMatches_ShouldReturnOkAndEmptyListAsync()
    {
        // Arrange
        await Database.SeedEntitiesAsync(GymTestDataFactory.CreateGym(g => g.County = County.Dublin));

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync("/api/v1/gym?county=Cork");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<GymDto> pagedResponse = await ReadJsonAsync<PagedResponse<GymDto>>(response);
        pagedResponse.Data.ShouldBeEmpty();
        pagedResponse.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task GetAllGyms_WhenOnLastPage_ShouldHaveHasNextPageFalseAsync()
    {
        // Arrange
        Gym[] gyms = Enumerable.Range(1, 4).Select(_ => GymTestDataFactory.CreateGym()).ToArray();
        await Database.SeedEntitiesAsync(gyms);
        GetGymPaginationQuery query = new()
        { Page = 2, PageSize = 2 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"/api/v1/gym?page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<GymDto> pagedResponse = await ReadJsonAsync<PagedResponse<GymDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalPages.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeFalse();
        pagedResponse.Pagination.HasPreviousPage.ShouldBeTrue();
    }
}
