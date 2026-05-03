// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Net;

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Application.Features.Competitions.Queries;
using BjjEire.Domain.Entities.Competitions;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.CompetitionControllerTests;

[Collection(CompetitionApiCollection.Name)]
[Trait("Feature", "Competitions")]
[Trait("Category", "Integration")]
public class GetAllCompetitionControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ApiIntegrationTestBase(fixture, output)
{
    [Fact]
    public async Task GetAllCompetitions_AnonymousAccess_ShouldReturn200Async()
    {
        // Arrange — deliberately no auth token
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync(ApiRoutes.Competitions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAllCompetitions_WhenNoCompetitionsExist_ShouldReturnOkAndEmptyListAsync()
    {
        // Arrange & Act
        HttpResponseMessage response = await HttpClient.GetAsync(ApiRoutes.Competitions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<CompetitionDto> pagedResponse = await ReadJsonAsync<PagedResponse<CompetitionDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Data.ShouldBeEmpty();
        pagedResponse.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task GetAllCompetitions_OnlyActiveCompetitionsReturned_InactiveExcludedAsync()
    {
        // Arrange
        Competition active = CompetitionTestDataFactory.CreateCompetition(c =>
        {
            c.IsActive = true;
            c.StartDate = DateTime.UtcNow.AddDays(7);
            c.EndDate = DateTime.UtcNow.AddDays(8);
        });
        Competition inactive = CompetitionTestDataFactory.CreateCompetition(c => c.IsActive = false);
        await Database.SeedEntitiesAsync(active, inactive);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync(ApiRoutes.Competitions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<CompetitionDto> pagedResponse = await ReadJsonAsync<PagedResponse<CompetitionDto>>(response);
        pagedResponse.Data.Count.ShouldBe(1);
        pagedResponse.Pagination.TotalItems.ShouldBe(1);
        pagedResponse.Data.ShouldAllBe(c => c.IsActive);
    }

    [Fact]
    public async Task GetAllCompetitions_ExpiredCompetitionsExcludedAsync()
    {
        // Arrange
        Competition upcoming = CompetitionTestDataFactory.CreateCompetition(c =>
        {
            c.IsActive = true;
            c.StartDate = DateTime.UtcNow.AddDays(7);
            c.EndDate = DateTime.UtcNow.AddDays(8);
        });
        Competition expired = CompetitionTestDataFactory.CreateCompetition(c =>
        {
            c.IsActive = true;
            c.StartDate = DateTime.UtcNow.AddDays(-10);
            c.EndDate = DateTime.UtcNow.AddDays(-1);
        });
        await Database.SeedEntitiesAsync(upcoming, expired);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync(ApiRoutes.Competitions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<CompetitionDto> pagedResponse = await ReadJsonAsync<PagedResponse<CompetitionDto>>(response);
        pagedResponse.Data.Count.ShouldBe(1);
        pagedResponse.Pagination.TotalItems.ShouldBe(1);
    }

    [Fact]
    public async Task GetAllCompetitions_OpenEndedCompetitions_ShouldBeIncludedAsync()
    {
        // Arrange
        Competition openEnded = CompetitionTestDataFactory.CreateCompetition(c =>
        {
            c.IsActive = true;
            c.StartDate = DateTime.UtcNow.AddDays(-30);
            c.EndDate = null;
        });
        await Database.SeedEntitiesAsync(openEnded);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync(ApiRoutes.Competitions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<CompetitionDto> pagedResponse = await ReadJsonAsync<PagedResponse<CompetitionDto>>(response);
        pagedResponse.Data.Count.ShouldBe(1);
    }

    [Fact]
    public async Task GetAllCompetitions_WithIncludeInactive_ShouldReturnAllCompetitionsAsync()
    {
        // Arrange
        Competition active = CompetitionTestDataFactory.CreateCompetition(c =>
        {
            c.IsActive = true;
            c.StartDate = DateTime.UtcNow.AddDays(7);
            c.EndDate = DateTime.UtcNow.AddDays(8);
        });
        Competition inactive = CompetitionTestDataFactory.CreateCompetition(c => c.IsActive = false);
        Competition expired = CompetitionTestDataFactory.CreateCompetition(c =>
        {
            c.IsActive = true;
            c.StartDate = DateTime.UtcNow.AddDays(-10);
            c.EndDate = DateTime.UtcNow.AddDays(-1);
        });
        await Database.SeedEntitiesAsync(active, inactive, expired);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"{ApiRoutes.Competitions}?includeInactive=true");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<CompetitionDto> pagedResponse = await ReadJsonAsync<PagedResponse<CompetitionDto>>(response);
        pagedResponse.Data.Count.ShouldBe(3);
        pagedResponse.Pagination.TotalItems.ShouldBe(3);
    }

    [Fact]
    public async Task GetAllCompetitions_WithPagination_ShouldRespectPageSizeAndNumberAsync()
    {
        // Arrange
        Competition[] competitions = Enumerable.Range(1, 5).Select(i =>
            CompetitionTestDataFactory.CreateCompetition(c =>
            {
                c.StartDate = DateTime.UtcNow.AddDays(i);
                c.EndDate = DateTime.UtcNow.AddDays(i + 1);
            })).ToArray();
        await Database.SeedEntitiesAsync(competitions);
        GetCompetitionPaginationQuery query = new()
        { Page = 2, PageSize = 2 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"{ApiRoutes.Competitions}?page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<CompetitionDto> pagedResponse = await ReadJsonAsync<PagedResponse<CompetitionDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(5);
        pagedResponse.Pagination.CurrentPage.ShouldBe(2);
        pagedResponse.Pagination.PageSize.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeTrue();
        pagedResponse.Pagination.HasPreviousPage.ShouldBeTrue();
    }

    [Fact]
    public async Task GetAllCompetitions_WithPageSizeLargerThanTotalItems_ShouldReturnAllItemsAsync()
    {
        // Arrange
        Competition[] competitions = Enumerable.Range(1, 3).Select(i =>
            CompetitionTestDataFactory.CreateCompetition(c =>
            {
                c.StartDate = DateTime.UtcNow.AddDays(i);
                c.EndDate = DateTime.UtcNow.AddDays(i + 1);
            })).ToArray();
        await Database.SeedEntitiesAsync(competitions);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"{ApiRoutes.Competitions}?pageSize=10");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<CompetitionDto> pagedResponse = await ReadJsonAsync<PagedResponse<CompetitionDto>>(response);
        pagedResponse.Data.Count.ShouldBe(3);
        pagedResponse.Pagination.TotalItems.ShouldBe(3);
        pagedResponse.Pagination.HasNextPage.ShouldBeFalse();
    }

    [Theory]
    [InlineData("page=0")]
    [InlineData("page=-1")]
    public async Task GetAllCompetitions_WithInvalidPageNumber_ShouldUseDefaultPageNumberAsync(string invalidPageQuery)
    {
        // Arrange
        await Database.SeedEntitiesAsync(CompetitionTestDataFactory.CreateCompetition(c =>
        {
            c.StartDate = DateTime.UtcNow.AddDays(7);
            c.EndDate = DateTime.UtcNow.AddDays(8);
        }));

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"{ApiRoutes.Competitions}?{invalidPageQuery}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<CompetitionDto> pagedResponse = await ReadJsonAsync<PagedResponse<CompetitionDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Pagination.CurrentPage.ShouldBe(1);
    }

    [Theory]
    [InlineData("pageSize=0")]
    [InlineData("pageSize=-1")]
    [InlineData("pageSize=101")]
    public async Task GetAllCompetitions_WithInvalidPageSize_ShouldUseDefaultPageSizeAsync(string invalidPageSizeQuery)
    {
        // Arrange
        Competition[] competitions = Enumerable.Range(1, 25).Select(i =>
            CompetitionTestDataFactory.CreateCompetition(c =>
            {
                c.StartDate = DateTime.UtcNow.AddDays(i);
                c.EndDate = DateTime.UtcNow.AddDays(i + 1);
            })).ToArray();
        await Database.SeedEntitiesAsync(competitions);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"{ApiRoutes.Competitions}?{invalidPageSizeQuery}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<CompetitionDto> pagedResponse = await ReadJsonAsync<PagedResponse<CompetitionDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Pagination.PageSize.ShouldBe(20);
        pagedResponse.Data.Count.ShouldBe(20);
    }

    [Fact]
    public async Task GetAllCompetitions_WhenOnLastPage_ShouldHaveHasNextPageFalseAsync()
    {
        // Arrange
        Competition[] competitions = Enumerable.Range(1, 4).Select(i =>
            CompetitionTestDataFactory.CreateCompetition(c =>
            {
                c.StartDate = DateTime.UtcNow.AddDays(i);
                c.EndDate = DateTime.UtcNow.AddDays(i + 1);
            })).ToArray();
        await Database.SeedEntitiesAsync(competitions);
        GetCompetitionPaginationQuery query = new()
        { Page = 2, PageSize = 2 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"{ApiRoutes.Competitions}?page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<CompetitionDto> pagedResponse = await ReadJsonAsync<PagedResponse<CompetitionDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalPages.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeFalse();
        pagedResponse.Pagination.HasPreviousPage.ShouldBeTrue();
    }
}
