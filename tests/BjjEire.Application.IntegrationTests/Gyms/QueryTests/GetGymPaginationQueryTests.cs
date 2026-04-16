namespace BjjEire.Application.IntegrationTests.Gyms.QueryTests;

[Collection(GymApplicationCollection.Name)]
[Trait("Feature", "Gyms")]
[Trait("Category", "Integration")]
public class GetGymPaginationQueryTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper)
    : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task GetGyms_WithNoData_ReturnsEmptyResult()
    {
        GetGymPaginatedResponse response = await SendAsync(new GetGymPaginationQuery { Page = 1, PageSize = 20 });

        response.Data.ShouldBeEmpty();
        response.Pagination.TotalItems.ShouldBe(0);
    }

    [Fact]
    public async Task GetGyms_ReturnsOnlyActiveGyms()
    {
        await Database.SeedEntitiesAsync(
            GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active),
            GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active),
            GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active),
            GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Draft),
            GymTestDataFactory.CreateGym(g => g.Status = GymStatus.PermanentlyClosed));

        GetGymPaginatedResponse response = await SendAsync(new GetGymPaginationQuery { Page = 1, PageSize = 20 });

        response.Data.Count.ShouldBe(3);
        response.Data.ShouldAllBe(g => g.Status == GymStatus.Active);
    }

    [Fact]
    public async Task GetGyms_FilterByCounty_ReturnsOnlyMatchingGyms()
    {
        await Database.SeedEntitiesAsync(
            GymTestDataFactory.CreateGym(g => { g.Status = GymStatus.Active; g.County = County.Cork; }),
            GymTestDataFactory.CreateGym(g => { g.Status = GymStatus.Active; g.County = County.Cork; }),
            GymTestDataFactory.CreateGym(g => { g.Status = GymStatus.Active; g.County = County.Dublin; }));

        GetGymPaginatedResponse response = await SendAsync(new GetGymPaginationQuery { Page = 1, PageSize = 20, County = County.Cork });

        response.Data.Count.ShouldBe(2);
        response.Data.ShouldAllBe(g => g.County == County.Cork);
    }

    [Fact]
    public async Task GetGyms_RespectsPageSize()
    {
        await Database.SeedEntitiesAsync(
            GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active),
            GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active),
            GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active),
            GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active),
            GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active));

        GetGymPaginatedResponse response = await SendAsync(new GetGymPaginationQuery { Page = 1, PageSize = 2 });

        response.Data.Count.ShouldBe(2);
        response.Pagination.TotalItems.ShouldBe(5);
        response.Pagination.TotalPages.ShouldBe(3);
        response.Pagination.HasNextPage.ShouldBeTrue();
        response.Pagination.HasPreviousPage.ShouldBeFalse();
    }
}
