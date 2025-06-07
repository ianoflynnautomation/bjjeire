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
public class GetAllGymsControllerTests(MongoDbTestContainerFixture fixture, ITestOutputHelper output)
    : SequentialTestBase(fixture, output)
{
    [Fact]
    public async Task GetAllGyms_WhenNoGymsExist_ShouldReturnOkAndEmptyList() {

            // Arrange

            // Act
            var response = await Http.GetAsync("/api/gym");

            // Assert
            response.StatusCode.ShouldBe(HttpStatusCode.OK);
            var pagedResponse = await Http.ReadAsJsonAsync<GetGymPaginatedResponse>(response);
            pagedResponse.ShouldNotBeNull();
            pagedResponse.Data.ShouldBeEmpty();
            pagedResponse.Pagination.TotalItems.ShouldBe(0);

    }

        [Fact]
        public async Task GetAllGyms_WhenGymsExist_ShouldReturnAllActiveGyms()
        {
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
    public async Task GetAllGyms_WithCountyFilter_ShouldReturnOnlyGymsFromThatCounty()
    {
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
            pagedResponse.ShouldNotBeNull();
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
            await Database.SeedEntitiesAsync( gym1, gym2);

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
            pagedResponse.ShouldNotBeNull();
            pagedResponse.Pagination.CurrentPage.ShouldBe(1);


    }

    [Theory]
    [InlineData("pageSize=0")]
    [InlineData("pageSize=-1")]
    [InlineData("pageSize=101")]
    public async Task GetAllGyms_WithInvalidPageSize_ShouldUseDefaultPageSize(string invalidPageSizeQuery)
    {
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

            pagedResponse.ShouldNotBeNull();
            pagedResponse.Pagination.PageSize.ShouldBe(20);
            pagedResponse.Data.Count.ShouldBe(20);

    }
}
