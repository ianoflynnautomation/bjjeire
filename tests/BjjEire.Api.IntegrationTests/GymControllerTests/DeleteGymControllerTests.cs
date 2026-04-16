
using System.Net;

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Enums;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.GymControllerTests;

[Collection(GymApiCollection.Name)]
[Trait("Feature", "Gyms")]
[Trait("Category", "Integration")]
public class DeleteGymControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ApiIntegrationTestBase(fixture, output)
{

    [Fact]
    public async Task DeleteGym_WithValidId_ShouldDeleteGymAsync()
    {
        // Arrange
        SetDefaultUserToken();
        Gym gym1 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        await Database.SeedEntitiesAsync(gym1);

        // Act
        HttpResponseMessage response = await HttpClient.DeleteAsync($"/api/gym/{gym1.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteGym_WithoutAuthentication_ShouldReturnUnauthorizedAsync()
    {
        // Arrange
        Gym gym1 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        await Database.SeedEntitiesAsync(gym1);
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        HttpResponseMessage response = await HttpClient.DeleteAsync($"/api/gym/{gym1.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteGym_WithInvalidId_ShouldReturnNotFoundAsync()
    {
        // Arrange
        SetDefaultUserToken();
        Gym gym1 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        await Database.SeedEntitiesAsync(gym1);
        Gym gym2 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);

        // Act
        HttpResponseMessage response = await HttpClient.DeleteAsync($"/api/gym/{gym2.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Theory]
    [InlineData("36f1dd1e11ad1a1bf11111a00")]
    [InlineData("f1dd1e11ad1a1bf11111a00")]
    [InlineData("not-a-valid-id")]
    public async Task DeleteGym_WithInvalidIdFormat_ShouldReturnBadRequestAsync(string invalidId)
    {
        // Arrange
        SetDefaultUserToken();

        // Act
        HttpResponseMessage response = await HttpClient.DeleteAsync($"/api/gym/{invalidId}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteGym_CalledTwiceOnSameId_ShouldBeIdempotentAsync()
    {
        // Arrange
        SetDefaultUserToken();
        Gym gym1 = GymTestDataFactory.CreateGym();
        await Database.SeedEntitiesAsync(gym1);

        // Act
        HttpResponseMessage firstResponse = await HttpClient.DeleteAsync($"/api/gym/{gym1.Id}");
        HttpResponseMessage secondResponse = await HttpClient.DeleteAsync($"/api/gym/{gym1.Id}");

        // Assert
        firstResponse.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        secondResponse.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteGym_ConcurrentRequests_ShouldHandleCorrectlyAsync()
    {
        // Arrange
        SetDefaultUserToken();
        Gym gym1 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        await Database.SeedEntitiesAsync(gym1);

        // Act
        const int concurrentRequestCount = 5;
        IEnumerable<Task<HttpResponseMessage>> deleteTasks = Enumerable.Range(0, concurrentRequestCount)
                                     .Select(_ => HttpClient.DeleteAsync($"/api/gym/{gym1.Id}"));

        HttpResponseMessage[] responses = await Task.WhenAll(deleteTasks);

        // Assert
        List<HttpStatusCode> statusCodes = responses.Select(r => r.StatusCode).ToList();
        statusCodes.Count(s => s == HttpStatusCode.NoContent).ShouldBe(1);
        statusCodes.Count(s => s == HttpStatusCode.Conflict || s == HttpStatusCode.NotFound).ShouldBe(concurrentRequestCount - 1);
    }

}
