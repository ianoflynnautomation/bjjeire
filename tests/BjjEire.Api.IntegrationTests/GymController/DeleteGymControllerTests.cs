
using System.Net;
using BjjEire.Api.IntegrationTests.Data;
using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Api.IntegrationTests.TestBases;
using BjjEire.Domain.Enums;
using Shouldly;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.GymController;

[Trait("Category", "Parallel")]
[Trait("Category", "Gym")]
public class DeleteGymControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ParallelTestBase(fixture, output) {

    [Fact]
    public async Task DeleteGym_WithValidId_ShouldDeleteGymAsync() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var gym1 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        await Database.SeedEntitiesAsync(gym1);

        // Act
        var response = await Http.DeleteAsync($"/api/gym/{gym1.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteGym_WithoutAuthentication_ShouldReturnUnauthorizedAsync() {
        // Arrange
        var gym1 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        await Database.SeedEntitiesAsync(gym1);
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await Http.DeleteAsync($"/api/gym/{gym1.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteGym_WithInvalidId_ShouldReturnNotFoundAsync() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var gym1 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        await Database.SeedEntitiesAsync(gym1);
        var gym2 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);

        // Act
        var response = await Http.DeleteAsync($"/api/gym/{gym2.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Theory]
    [InlineData("36f1dd1e11ad1a1bf11111a00")]
    [InlineData("f1dd1e11ad1a1bf11111a00")]
    [InlineData("not-a-valid-id")]
    public async Task DeleteGym_WithInvalidIdFormat_ShouldReturnBadRequestAsync(string invalidId) {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();

        // Act
        var response = await Http.DeleteAsync($"/api/gym/{invalidId}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteGym_CalledTwiceOnSameId_ShouldBeIdempotentAsync() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var gym1 = GymTestDataFactory.CreateGym();
        await Database.SeedEntitiesAsync(gym1);

        // Act
        var firstResponse = await Http.DeleteAsync($"/api/gym/{gym1.Id}");
        var secondResponse = await Http.DeleteAsync($"/api/gym/{gym1.Id}");

        // Assert
        firstResponse.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        secondResponse.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteGym_ConcurrentRequests_ShouldHandleCorrectlyAsync() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var gym1 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        await Database.SeedEntitiesAsync(gym1);

        // Act
        const int concurrentRequestCount = 5;
        var deleteTasks = Enumerable.Range(0, concurrentRequestCount)
                                     .Select(_ => Http.DeleteAsync($"/api/gym/{gym1.Id}"));

        var responses = await Task.WhenAll(deleteTasks);

        // Assert
        var statusCodes = responses.Select(r => r.StatusCode).ToList();
        statusCodes.Count(s => s == HttpStatusCode.NoContent).ShouldBe(1);
        statusCodes.Count(s => s == HttpStatusCode.Conflict).ShouldBe(1);
        statusCodes.Count(s => s == HttpStatusCode.NotFound).ShouldBe(concurrentRequestCount - 2);
    }


    // [Fact]
    // public async Task DeleteGym_WithEmptyOrNullId_ShouldReturnBadRequest() {
    //     // Arrange
    //     await Auth.SetDefaultUserAuthTokenAsync();
    //     var emptyId = "";

    //     // Act
    //     var emptyIdResponse = await Http.DeleteAsync($"/api/gym/{emptyId}");
    //     var nullIdResponse = await Http.DeleteAsync("/api/gym/");

    //     // Assert
    //     emptyIdResponse.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    //     nullIdResponse.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    // }

}
