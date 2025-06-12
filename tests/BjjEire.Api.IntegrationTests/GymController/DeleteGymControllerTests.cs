
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
    public async Task DeleteGym_WithValidAuthentication_ShouldDeleteGym() {
        // Arrange
        var gym1 = GymTestDataFactory.CreateGym(g => g.Status = GymStatus.Active);
        await Database.SeedEntitiesAsync(gym1);

        // Act
        var response = await Http.GetAsync($"/api/delete/{gym1.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);

    }

}