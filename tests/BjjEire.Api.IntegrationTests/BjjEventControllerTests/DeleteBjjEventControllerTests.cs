// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Domain.Enums;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.BjjEventControllerTests;

[Trait("Category", "Parallel")]
[Trait("Category", "BjjEvent")]
[Trait("Category", "Integration")]
public class DeleteBjjEventControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ParallelTestBase(fixture, output)
{

    [Fact]
    public async Task DeleteBjjEvent_WithValidId_ShouldDeleteBjjEventAsync()
    {
        // Arrange
        SetDefaultUserToken();
        var bjjevent1 = BjjEventTestDataFactory.CreateBjjEvent(g => g.Status = EventStatus.Upcoming);
        await Database.SeedEntitiesAsync(bjjevent1);

        // Act
        var response = await HttpClient.DeleteAsync($"/api/bjjevent/{bjjevent1.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteBjjEvent_WithoutAuthentication_ShouldReturnUnauthorizedAsync()
    {
        // Arrange
        var bjjevent1 = BjjEventTestDataFactory.CreateBjjEvent(g => g.Status = EventStatus.Upcoming);
        await Database.SeedEntitiesAsync(bjjevent1);
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await HttpClient.DeleteAsync($"/api/bjjevent/{bjjevent1.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }


    [Fact]
    public async Task DeleteBjjEvent_WithInvalidId_ShouldReturnNotFoundAsync()
    {
        // Arrange
        SetDefaultUserToken();
        var bjjevent1 = BjjEventTestDataFactory.CreateBjjEvent(g => g.Status = EventStatus.Upcoming);
        await Database.SeedEntitiesAsync(bjjevent1);
        var bjjevent2 = BjjEventTestDataFactory.CreateBjjEvent(g => g.Status = EventStatus.Upcoming);

        // Act
        var response = await HttpClient.DeleteAsync($"/api/bjjevent/{bjjevent2.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Theory]
    [InlineData("36f1dd1e11ad1a1bf11111a00")]
    [InlineData("f1dd1e11ad1a1bf11111a00")]
    [InlineData("not-a-valid-id")]
    public async Task DeleteBjjEvent_WithInvalidIdFormat_ShouldReturnBadRequestAsync(string invalidId)
    {
        // Arrange
        SetDefaultUserToken();

        // Act
        var response = await HttpClient.DeleteAsync($"/api/bjjevent/{invalidId}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteBjjEvent_CalledTwiceOnSameId_ShouldBeIdempotentAsync()
    {
        // Arrange
        SetDefaultUserToken();
        var bjjevent1 = BjjEventTestDataFactory.CreateBjjEvent();
        await Database.SeedEntitiesAsync(bjjevent1);

        // Act
        var firstResponse = await HttpClient.DeleteAsync($"/api/bjjevent/{bjjevent1.Id}");
        var secondResponse = await HttpClient.DeleteAsync($"/api/bjjevent/{bjjevent1.Id}");

        // Assert
        firstResponse.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        secondResponse.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteBjjEvent_ConcurrentRequests_ShouldHandleCorrectlyAsync()
    {
        // Arrange
        SetDefaultUserToken();
        var bjjevent1 = BjjEventTestDataFactory.CreateBjjEvent(g => g.Status = EventStatus.Upcoming);
        await Database.SeedEntitiesAsync(bjjevent1);

        // Act
        const int concurrentRequestCount = 5;
        var deleteTasks = Enumerable.Range(0, concurrentRequestCount)
                                     .Select(_ => HttpClient.DeleteAsync($"/api/bjjevent/{bjjevent1.Id}"));

        var responses = await Task.WhenAll(deleteTasks);

        // Assert
        var statusCodes = responses.Select(r => r.StatusCode).ToList();
        statusCodes.Count(s => s == HttpStatusCode.NoContent).ShouldBe(1);
        statusCodes.Count(s => s == HttpStatusCode.Conflict || s == HttpStatusCode.NotFound).ShouldBe(concurrentRequestCount - 1);
    }

}
