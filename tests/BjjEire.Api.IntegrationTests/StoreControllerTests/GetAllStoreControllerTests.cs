// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Net;

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Application.Features.Stores.Queries;
using BjjEire.Domain.Entities.Stores;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.StoreControllerTests;

[Collection(StoreApiCollection.Name)]
[Trait("Feature", "Stores")]
[Trait("Category", "Integration")]
public class GetAllStoreControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ApiIntegrationTestBase(fixture, output)
{
    [Fact]
    public async Task GetAllStores_AnonymousAccess_ShouldReturn200Async()
    {
        // Arrange — deliberately no auth token
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync(ApiRoutes.Stores);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAllStores_WhenNoStoresExist_ShouldReturnOkAndEmptyListAsync()
    {
        // Arrange & Act
        HttpResponseMessage response = await HttpClient.GetAsync(ApiRoutes.Stores);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<StoreDto> pagedResponse = await ReadJsonAsync<PagedResponse<StoreDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Data.ShouldBeEmpty();
        pagedResponse.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task GetAllStores_OnlyActiveStoresReturned_InactiveExcludedAsync()
    {
        // Arrange
        Store active1 = StoreTestDataFactory.CreateStore(s => s.IsActive = true);
        Store active2 = StoreTestDataFactory.CreateStore(s => s.IsActive = true);
        Store inactive = StoreTestDataFactory.CreateStore(s => s.IsActive = false);
        await Database.SeedEntitiesAsync(active1, active2, inactive);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync(ApiRoutes.Stores);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<StoreDto> pagedResponse = await ReadJsonAsync<PagedResponse<StoreDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);
        pagedResponse.Data.ShouldAllBe(s => s.IsActive);
    }

    [Fact]
    public async Task GetAllStores_WhenStoresExist_ShouldReturnAllActiveStoresAsync()
    {
        // Arrange
        Store store1 = StoreTestDataFactory.CreateStore();
        Store store2 = StoreTestDataFactory.CreateStore();
        Store store3 = StoreTestDataFactory.CreateStore();
        await Database.SeedEntitiesAsync(store1, store2, store3);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync(ApiRoutes.Stores);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<StoreDto> pagedResponse = await ReadJsonAsync<PagedResponse<StoreDto>>(response);
        pagedResponse.Data.Count.ShouldBe(3);
        pagedResponse.Pagination.TotalItems.ShouldBe(3);
    }

    [Fact]
    public async Task GetAllStores_WithPagination_ShouldRespectPageSizeAndNumberAsync()
    {
        // Arrange
        Store[] stores = Enumerable.Range(1, 5).Select(_ => StoreTestDataFactory.CreateStore()).ToArray();
        await Database.SeedEntitiesAsync(stores);
        GetStorePaginationQuery query = new()
        { Page = 2, PageSize = 2 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"{ApiRoutes.Stores}?page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<StoreDto> pagedResponse = await ReadJsonAsync<PagedResponse<StoreDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(5);
        pagedResponse.Pagination.CurrentPage.ShouldBe(2);
        pagedResponse.Pagination.PageSize.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeTrue();
        pagedResponse.Pagination.HasPreviousPage.ShouldBeTrue();
    }

    [Fact]
    public async Task GetAllStores_WithPageSizeLargerThanTotalItems_ShouldReturnAllItemsAsync()
    {
        // Arrange
        Store store1 = StoreTestDataFactory.CreateStore();
        Store store2 = StoreTestDataFactory.CreateStore();
        await Database.SeedEntitiesAsync(store1, store2);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"{ApiRoutes.Stores}?pageSize=10");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<StoreDto> pagedResponse = await ReadJsonAsync<PagedResponse<StoreDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalItems.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeFalse();
    }

    [Theory]
    [InlineData("page=0")]
    [InlineData("page=-1")]
    public async Task GetAllStores_WithInvalidPageNumber_ShouldUseDefaultPageNumberAsync(string invalidPageQuery)
    {
        // Arrange
        await Database.SeedEntitiesAsync(StoreTestDataFactory.CreateStore());

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"{ApiRoutes.Stores}?{invalidPageQuery}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<StoreDto> pagedResponse = await ReadJsonAsync<PagedResponse<StoreDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Pagination.CurrentPage.ShouldBe(1);
    }

    [Theory]
    [InlineData("pageSize=0")]
    [InlineData("pageSize=-1")]
    [InlineData("pageSize=101")]
    public async Task GetAllStores_WithInvalidPageSize_ShouldUseDefaultPageSizeAsync(string invalidPageSizeQuery)
    {
        // Arrange
        Store[] storesToSeed = Enumerable.Range(1, 25)
            .Select(_ => StoreTestDataFactory.CreateStore())
            .ToArray();
        await Database.SeedEntitiesAsync(storesToSeed);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"{ApiRoutes.Stores}?{invalidPageSizeQuery}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<StoreDto> pagedResponse = await ReadJsonAsync<PagedResponse<StoreDto>>(response);
        _ = pagedResponse.ShouldNotBeNull();
        pagedResponse.Pagination.PageSize.ShouldBe(20);
        pagedResponse.Data.Count.ShouldBe(20);
    }

    [Fact]
    public async Task GetAllStores_ShouldReturnStoresSortedByNameAsync()
    {
        // Arrange
        Store storeC = StoreTestDataFactory.CreateStore(s => s.Name = "C-Store");
        Store storeA = StoreTestDataFactory.CreateStore(s => s.Name = "A-Store");
        Store storeB = StoreTestDataFactory.CreateStore(s => s.Name = "B-Store");
        await Database.SeedEntitiesAsync(storeC, storeA, storeB);

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync(ApiRoutes.Stores);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<StoreDto> pagedResponse = await ReadJsonAsync<PagedResponse<StoreDto>>(response);
        pagedResponse.Data.Select(s => s.Name).ShouldBe(["A-Store", "B-Store", "C-Store"]);
    }

    [Fact]
    public async Task GetAllStores_WhenOnLastPage_ShouldHaveHasNextPageFalseAsync()
    {
        // Arrange
        Store[] stores = Enumerable.Range(1, 4).Select(_ => StoreTestDataFactory.CreateStore()).ToArray();
        await Database.SeedEntitiesAsync(stores);
        GetStorePaginationQuery query = new()
        { Page = 2, PageSize = 2 };

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync($"{ApiRoutes.Stores}?page={query.Page}&pageSize={query.PageSize}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        PagedResponse<StoreDto> pagedResponse = await ReadJsonAsync<PagedResponse<StoreDto>>(response);
        pagedResponse.Data.Count.ShouldBe(2);
        pagedResponse.Pagination.TotalPages.ShouldBe(2);
        pagedResponse.Pagination.HasNextPage.ShouldBeFalse();
        pagedResponse.Pagination.HasPreviousPage.ShouldBeTrue();
    }
}
