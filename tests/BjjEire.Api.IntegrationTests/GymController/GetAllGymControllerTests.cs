// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using BjjEire.Api.IntegrationTests.Data;
using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Api.IntegrationTests.TestBases;
using BjjEire.Application.Features.Gyms.Queries;
using BjjEire.Domain.Enums;
using Shouldly;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.GymController;

[Trait("Category", "Sequential")]
[Trait("Category", "Gym")]
[Trait("Category", "Test")]
public class GetAllGymsControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : SequentialTestBase(fixture, output) {

    [Fact]
    public async Task GetAllGyms_WhenNoGymsExist_ShouldReturnOkAndEmptyList() {
        // Arrange

        // Act
        var response = await Http.GetAsync("/api/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await Http.ReadAsJsonAsync<GetGymPaginatedResponse>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Data.ShouldBeEmpty();
        pagedResponse.Pagination.TotalItems.ShouldBe(0);

    }

    [Fact]
    public async Task GetAllGyms_WhenGymsExist_ShouldReturnAllActiveGyms() {
        // Arrange
        var inactiveGym = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.PermanentlyClosed);
        var gym1 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        var gym2 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        await Database.SeedEntitiesAsync(gym1, gym2, inactiveGym);

        // Act
        var response = await Http.GetAsync("/api/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await Http.ReadAsJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);

    }


    [Fact]
    public async Task GetAllGyms_WithCountyFilter_ShouldReturnOnlyGymsFromThatCounty() {
        // Arrange
        var gym1 = GymTestDataFactory.CreateGym(g => g.County = County.Cork);
        var gym2 = GymTestDataFactory.CreateGym(g => g.County = County.Cork);
        var gym3 = GymTestDataFactory.CreateGym(g => g.County = County.Dublin);
        await Database.SeedEntitiesAsync(gym1, gym2, gym3);
        var query = new GetGymPaginationQuery { County = County.Cork, Page = 1, PageSize = 20 };

        // Act
        var response = await Http.GetAsync($"/api/gym?county={query.County}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await Http.ReadAsJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);
        pagedResponse.Pagination.PageSize.ShouldBe(query.PageSize);
        pagedResponse.Pagination.TotalPages.ShouldBe(query.Page);

    }


    [Fact]
    public async Task GetAllGyms_WithPagination_ShouldRespectPageSizeAndNumber() {

        // Arrange
        var gyms = Enumerable.Range(1, 5).Select(_ => GymTestDataFactory.GetValidGym()).ToArray();
        await Database.SeedEntitiesAsync(gyms);
        var query = new GetGymPaginationQuery { Page = 2, PageSize = 2 };

        // Act
        var response = await Http.GetAsync($"/api/gym?page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await Http.ReadAsJsonAsync<GetGymPaginatedResponse>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(5);
        pagedResponse.Pagination.CurrentPage.ShouldBe(2);
        pagedResponse.Pagination.PageSize.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeTrue();
        pagedResponse.Pagination.HasPreviousPage.ShouldBeTrue();
    }

    [Fact]
    public async Task GetAllGyms_WithPageSizeLargerThanTotalItems_ShouldReturnAllItems() {

        // Arrange
        var gym1 = GymTestDataFactory.CreateGym(g => g.County = County.Cork);
        var gym2 = GymTestDataFactory.CreateGym(g => g.County = County.Cork);
        await Database.SeedEntitiesAsync(gym1, gym2);

        // Act
        var response = await Http.GetAsync("/api/gym?pageSize=10");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await Http.ReadAsJsonAsync<GetGymPaginatedResponse>(response);

        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeFalse();

    }

    [Theory]
    [InlineData("page=0")]
    [InlineData("page=-1")]
    public async Task GetAllGyms_WithInvalidPageNumber_ShouldUseDefaultPageNumber(string invalidPageQuery) {

        // Arrange
        await Database.SeedEntitiesAsync(GymTestDataFactory.GetValidGym());

        // Act
        var response = await Http.GetAsync($"/api/gym?{invalidPageQuery}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await Http.ReadAsJsonAsync<GetGymPaginatedResponse>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Pagination.CurrentPage.ShouldBe(1);

    }

    [Theory]
    [InlineData("pageSize=0")]
    [InlineData("pageSize=-1")]
    [InlineData("pageSize=101")]
    public async Task GetAllGyms_WithInvalidPageSize_ShouldUseDefaultPageSize(string invalidPageSizeQuery) {
        // Arrange
        var gymsToSeed = Enumerable.Range(1, 25)
            .Select(_ => GymTestDataFactory.GetValidGym())
            .ToArray();
        await Database.SeedEntitiesAsync(gymsToSeed);

        // Act
        var response = await Http.GetAsync($"/api/gym?{invalidPageSizeQuery}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await Http.ReadAsJsonAsync<GetGymPaginatedResponse>(response);

        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Pagination.PageSize.ShouldBe(20);
        pagedResponse.Data.Count.ShouldBe(20);

    }

    [Fact]
    public async Task GetAllGyms_WithFilterAndPagination_ShouldReturnCorrectSubset() {
        // Arrange
        var gymsInCork = Enumerable.Range(1, 5).Select(i => GymTestDataFactory.CreateGym(g => {
            g.Name = $"Cork Gym {i}";
            g.County = County.Cork;
        })).ToArray();
        await Database.SeedEntitiesAsync(gymsInCork);
        await Database.SeedEntitiesAsync(GymTestDataFactory.CreateGym(g => g.County = County.Dublin));
        var query = new GetGymPaginationQuery { County = County.Cork, Page = 2, PageSize = 3 };

        // Act
        var response = await Http.GetAsync($"/api/gym?county={query.County}&page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await Http.ReadAsJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(5);
        pagedResponse.Pagination.CurrentPage.ShouldBe(2);
    }

    [Fact]
    public async Task GetAllGyms_ShouldReturnGymsSortedByName() {
        // Arrange
        var gymC = GymTestDataFactory.CreateGym(g => g.Name = "C-Team Gym");
        var gymA = GymTestDataFactory.CreateGym(g => g.Name = "A-Team Gym");
        var gymB = GymTestDataFactory.CreateGym(g => g.Name = "B-Team Gym");
        await Database.SeedEntitiesAsync(gymC, gymA, gymB);

        // Act
        var response = await Http.GetAsync("/api/gym");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await Http.ReadAsJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.Select(g => g.Name).ShouldBe(["A-Team Gym", "B-Team Gym", "C-Team Gym"]);
    }

    // [Theory]
    // [InlineData("county=InvalidValue")]
    // [InlineData("county=99")]
    // public async Task GetAllGyms_WithInvalidCountyValue_ShouldReturnBadRequest(string query) {
    //     // Arrange & Act
    //     var response = await Http.GetAsync($"/api/gym?{query}");

    //     // Assert
    //     response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    // }

    [Fact]
    public async Task GetAllGyms_WithFilterThatHasNoMatches_ShouldReturnOkAndEmptyList() {
        // Arrange
        await Database.SeedEntitiesAsync(GymTestDataFactory.CreateGym(g => g.County = County.Dublin));

        // Act
        var response = await Http.GetAsync("/api/gym?county=Cork");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await Http.ReadAsJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.ShouldBeEmpty();
        pagedResponse.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task GetAllGyms_WhenOnLastPage_ShouldHaveHasNextPageFalse() {
        // Arrange
        var gyms = Enumerable.Range(1, 4).Select(_ => GymTestDataFactory.GetValidGym()).ToArray();
        await Database.SeedEntitiesAsync(gyms);
        var query = new GetGymPaginationQuery { Page = 2, PageSize = 2 };

        // Act
        var response = await Http.GetAsync($"/api/gym?page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var pagedResponse = await Http.ReadAsJsonAsync<GetGymPaginatedResponse>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalPages.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeFalse();
        pagedResponse.Pagination.HasPreviousPage.ShouldBeTrue();
    }
}
