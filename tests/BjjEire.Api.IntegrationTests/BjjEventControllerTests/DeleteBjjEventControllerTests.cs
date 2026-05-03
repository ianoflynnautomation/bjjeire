// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Net;

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Enums;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.BjjEventControllerTests;

[Collection(BjjEventApiCollection.Name)]
[Trait("Feature", "BjjEvents")]
[Trait("Category", "Integration")]
public class DeleteBjjEventControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ApiIntegrationTestBase(fixture, output)
{

    [Fact]
    public async Task DeleteBjjEvent_WithValidId_ShouldDeleteBjjEventAsync()
    {
        // Arrange
        SetDefaultUserToken();
        BjjEvent bjjevent1 = BjjEventTestDataFactory.CreateBjjEvent(g => g.Status = EventStatus.Upcoming);
        await Database.SeedEntitiesAsync(bjjevent1);

        // Act
        HttpResponseMessage response = await HttpClient.DeleteAsync($"{ApiRoutes.BjjEvents}/{bjjevent1.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteBjjEvent_WithoutAuthentication_ShouldReturnUnauthorizedAsync()
    {
        // Arrange
        BjjEvent bjjevent1 = BjjEventTestDataFactory.CreateBjjEvent(g => g.Status = EventStatus.Upcoming);
        await Database.SeedEntitiesAsync(bjjevent1);
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        HttpResponseMessage response = await HttpClient.DeleteAsync($"{ApiRoutes.BjjEvents}/{bjjevent1.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }


    [Fact]
    public async Task DeleteBjjEvent_WithInvalidId_ShouldReturnNotFoundAsync()
    {
        // Arrange
        SetDefaultUserToken();
        BjjEvent bjjevent1 = BjjEventTestDataFactory.CreateBjjEvent(g => g.Status = EventStatus.Upcoming);
        await Database.SeedEntitiesAsync(bjjevent1);
        BjjEvent bjjevent2 = BjjEventTestDataFactory.CreateBjjEvent(g => g.Status = EventStatus.Upcoming);

        // Act
        HttpResponseMessage response = await HttpClient.DeleteAsync($"{ApiRoutes.BjjEvents}/{bjjevent2.Id}");

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
        HttpResponseMessage response = await HttpClient.DeleteAsync($"{ApiRoutes.BjjEvents}/{invalidId}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteBjjEvent_CalledTwiceOnSameId_ShouldBeIdempotentAsync()
    {
        // Arrange
        SetDefaultUserToken();
        BjjEvent bjjevent1 = BjjEventTestDataFactory.CreateBjjEvent();
        await Database.SeedEntitiesAsync(bjjevent1);

        // Act
        HttpResponseMessage firstResponse = await HttpClient.DeleteAsync($"{ApiRoutes.BjjEvents}/{bjjevent1.Id}");
        HttpResponseMessage secondResponse = await HttpClient.DeleteAsync($"{ApiRoutes.BjjEvents}/{bjjevent1.Id}");

        // Assert
        firstResponse.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        secondResponse.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteBjjEvent_ConcurrentRequests_ShouldHandleCorrectlyAsync()
    {
        // Arrange
        SetDefaultUserToken();
        BjjEvent bjjevent1 = BjjEventTestDataFactory.CreateBjjEvent(g => g.Status = EventStatus.Upcoming);
        await Database.SeedEntitiesAsync(bjjevent1);

        // Act
        const int concurrentRequestCount = 5;
        IEnumerable<Task<HttpResponseMessage>> deleteTasks = Enumerable.Range(0, concurrentRequestCount)
                                     .Select(_ => HttpClient.DeleteAsync($"{ApiRoutes.BjjEvents}/{bjjevent1.Id}"));

        HttpResponseMessage[] responses = await Task.WhenAll(deleteTasks);

        // Assert
        List<HttpStatusCode> statusCodes = responses.Select(r => r.StatusCode).ToList();
        statusCodes.Count(s => s == HttpStatusCode.NoContent).ShouldBe(1);
        statusCodes.Count(s => s is HttpStatusCode.Conflict or HttpStatusCode.NotFound).ShouldBe(concurrentRequestCount - 1);
    }

}
