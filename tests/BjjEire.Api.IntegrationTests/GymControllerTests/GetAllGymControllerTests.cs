// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Application.Features.Gyms.Queries;
using BjjEire.Domain.Enums;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.GymControllerTests;

[Trait("Category", "Sequential")]
[Trait("Category", "Gym")]
[Trait("Category", "Integration")]
public class GetAllGymsControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : SequentialTestBase(fixture, output)
{

    [Fact]
    public async Task GetAllGyms_AnonymousAccess_ShouldReturn200Async()
    {
        // Arrange — deliberately no auth token
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await HttpClient.GetAsync("/api/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAllGyms_OnlyActiveGymsReturned_AllOtherStatusesExcludedAsync()
    {
        // Arrange
        var active = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        var pendingApproval = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.PendingApproval);
        var temporarilyClosed = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.TemporarilyClosed);
        var permanentlyClosed = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.PermanentlyClosed);
        var draft = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Draft);
        await Database.SeedEntitiesAsync(active, pendingApproval, temporarilyClosed, permanentlyClosed, draft);

        // Act
        var response = await HttpClient.GetAsync("/api/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await ReadJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.Count.ShouldBe(1);
        pagedResponse.Pagination.TotalItems.ShouldBe(1);
        pagedResponse.Data.ShouldAllBe(g => g.Status == GymStatus.Active);
    }

    [Fact]
    public async Task GetAllGyms_WhenNoGymsExist_ShouldReturnOkAndEmptyListAsync()
    {
        // Arrange & Act
        var response = await HttpClient.GetAsync("/api/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await ReadJsonAsync<GetGymPaginatedResponse>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Data.ShouldBeEmpty();
        pagedResponse.Pagination.TotalItems.ShouldBe(0);

    }

    [Fact]
    public async Task GetAllGyms_WhenGymsExist_ShouldReturnAllActiveGymsAsync()
    {
        // Arrange
        var inactiveGym = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.PermanentlyClosed);
        var gym1 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        var gym2 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        await Database.SeedEntitiesAsync(gym1, gym2, inactiveGym);

        // Act
        var response = await HttpClient.GetAsync("/api/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await ReadJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);

    }


    [Fact]
    public async Task GetAllGyms_WithCountyFilter_ShouldReturnOnlyGymsFromThatCountyAsync()
    {
        // Arrange
        var gym1 = GymTestDataFactory.CreateGym(g => g.County = County.Cork);
        var gym2 = GymTestDataFactory.CreateGym(g => g.County = County.Cork);
        var gym3 = GymTestDataFactory.CreateGym(g => g.County = County.Dublin);
        await Database.SeedEntitiesAsync(gym1, gym2, gym3);
        var query = new GetGymPaginationQuery { County = County.Cork, Page = 1, PageSize = 20 };

        // Act
        var response = await HttpClient.GetAsync($"/api/gym?county={query.County}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await ReadJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);
        pagedResponse.Pagination.PageSize.ShouldBe(query.PageSize);
        pagedResponse.Pagination.TotalPages.ShouldBe(query.Page);

    }


    [Fact]
    public async Task GetAllGyms_WithPagination_ShouldRespectPageSizeAndNumberAsync()
    {

        // Arrange
        var gyms = Enumerable.Range(1, 5).Select(_ => GymTestDataFactory.CreateGym()).ToArray();
        await Database.SeedEntitiesAsync(gyms);
        var query = new GetGymPaginationQuery { Page = 2, PageSize = 2 };

        // Act
        var response = await HttpClient.GetAsync($"/api/gym?page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await ReadJsonAsync<GetGymPaginatedResponse>(response);
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
        var gym1 = GymTestDataFactory.CreateGym(g => g.County = County.Cork);
        var gym2 = GymTestDataFactory.CreateGym(g => g.County = County.Cork);
        await Database.SeedEntitiesAsync(gym1, gym2);

        // Act
        var response = await HttpClient.GetAsync("/api/gym?pageSize=10");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await ReadJsonAsync<GetGymPaginatedResponse>(response);

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
        var response = await HttpClient.GetAsync($"/api/gym?{invalidPageQuery}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await ReadJsonAsync<GetGymPaginatedResponse>(response);
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
        var gymsToSeed = Enumerable.Range(1, 25)
            .Select(_ => GymTestDataFactory.CreateGym())
            .ToArray();
        await Database.SeedEntitiesAsync(gymsToSeed);

        // Act
        var response = await HttpClient.GetAsync($"/api/gym?{invalidPageSizeQuery}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await ReadJsonAsync<GetGymPaginatedResponse>(response);

        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Pagination.PageSize.ShouldBe(20);
        pagedResponse.Data.Count.ShouldBe(20);

    }

    [Fact]
    public async Task GetAllGyms_WithFilterAndPagination_ShouldReturnCorrectSubsetAsync()
    {
        // Arrange
        var gymsInCork = Enumerable.Range(1, 5).Select(i => GymTestDataFactory.CreateGym(g =>
        {
            g.Name = $"Cork Gym {i}";
            g.County = County.Cork;
        })).ToArray();
        await Database.SeedEntitiesAsync(gymsInCork);
        await Database.SeedEntitiesAsync(GymTestDataFactory.CreateGym(g => g.County = County.Dublin));
        var query = new GetGymPaginationQuery { County = County.Cork, Page = 2, PageSize = 3 };

        // Act
        var response = await HttpClient.GetAsync($"/api/gym?county={query.County}&page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await ReadJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(5);
        pagedResponse.Pagination.CurrentPage.ShouldBe(2);
    }

    [Fact]
    public async Task GetAllGyms_ShouldReturnGymsSortedByNameAsync()
    {
        // Arrange
        var gymC = GymTestDataFactory.CreateGym(g => g.Name = "C-Team Gym");
        var gymA = GymTestDataFactory.CreateGym(g => g.Name = "A-Team Gym");
        var gymB = GymTestDataFactory.CreateGym(g => g.Name = "B-Team Gym");
        await Database.SeedEntitiesAsync(gymC, gymA, gymB);

        // Act
        var response = await HttpClient.GetAsync("/api/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await ReadJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.Select(g => g.Name).ShouldBe(["A-Team Gym", "B-Team Gym", "C-Team Gym"]);
    }

    [Fact]
    public async Task GetAllGyms_WithFilterThatHasNoMatches_ShouldReturnOkAndEmptyListAsync()
    {
        // Arrange
        await Database.SeedEntitiesAsync(GymTestDataFactory.CreateGym(g => g.County = County.Dublin));

        // Act
        var response = await HttpClient.GetAsync("/api/gym?county=Cork");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await ReadJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.ShouldBeEmpty();
        pagedResponse.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task GetAllGyms_WhenOnLastPage_ShouldHaveHasNextPageFalseAsync()
    {
        // Arrange
        var gyms = Enumerable.Range(1, 4).Select(_ => GymTestDataFactory.CreateGym()).ToArray();
        await Database.SeedEntitiesAsync(gyms);
        var query = new GetGymPaginationQuery { Page = 2, PageSize = 2 };

        // Act
        var response = await HttpClient.GetAsync($"/api/gym?page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await ReadJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalPages.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeFalse();
        pagedResponse.Pagination.HasPreviousPage.ShouldBeTrue();
    }
}
