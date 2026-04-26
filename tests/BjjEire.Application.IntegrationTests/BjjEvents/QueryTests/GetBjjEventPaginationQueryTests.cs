// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Application.IntegrationTests.BjjEvents.QueryTests;

[Collection(BjjEventApplicationCollection.Name)]
[Trait("Feature", "BjjEvents")]
[Trait("Category", "Integration")]
public class GetBjjEventPaginationQueryTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper)
    : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task GetBjjEvents_WithNoData_ReturnsEmptyResult()
    {
        PagedResponse<BjjEventDto> response = await SendAsync(new GetBjjEventPaginationQuery { Page = 1, PageSize = 20 });

        response.Data.ShouldBeEmpty();
        response.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task GetBjjEvents_FilterByCounty_ReturnsOnlyMatchingEvents()
    {
        await Database.SeedEntitiesAsync(
            BjjEventTestDataFactory.CreateBjjEvent(e => e.County = County.Cork),
            BjjEventTestDataFactory.CreateBjjEvent(e => e.County = County.Cork),
            BjjEventTestDataFactory.CreateBjjEvent(e => e.County = County.Dublin));

        PagedResponse<BjjEventDto> response = await SendAsync(new GetBjjEventPaginationQuery { Page = 1, PageSize = 20, County = County.Cork });

        response.Data.Count.ShouldBe(2);
        response.Data.ShouldAllBe(e => e.County == County.Cork);
    }

    [Fact]
    public async Task GetBjjEvents_FilterByType_ReturnsOnlyMatchingEvents()
    {
        await Database.SeedEntitiesAsync(
            BjjEventTestDataFactory.CreateBjjEvent(e => e.Type = BjjEventType.Seminar),
            BjjEventTestDataFactory.CreateBjjEvent(e => e.Type = BjjEventType.Seminar),
            BjjEventTestDataFactory.CreateBjjEvent(e => e.Type = BjjEventType.Camp));

        PagedResponse<BjjEventDto> response = await SendAsync(new GetBjjEventPaginationQuery { Page = 1, PageSize = 20, Type = BjjEventType.Seminar });

        response.Data.Count.ShouldBe(2);
        response.Data.ShouldAllBe(e => e.Type == BjjEventType.Seminar);
    }

    [Fact]
    public async Task GetBjjEvents_RespectsPageSize()
    {
        await Database.SeedEntitiesAsync(
            BjjEventTestDataFactory.CreateBjjEvent(),
            BjjEventTestDataFactory.CreateBjjEvent(),
            BjjEventTestDataFactory.CreateBjjEvent(),
            BjjEventTestDataFactory.CreateBjjEvent(),
            BjjEventTestDataFactory.CreateBjjEvent());

        PagedResponse<BjjEventDto> response = await SendAsync(new GetBjjEventPaginationQuery { Page = 1, PageSize = 2 });

        response.Data.Count.ShouldBe(2);
        response.Pagination.TotalItems.ShouldBe(5);
        response.Pagination.TotalPages.ShouldBe(3);
        response.Pagination.HasNextPage.ShouldBeTrue();
        response.Pagination.HasPreviousPage.ShouldBeFalse();
    }
}
