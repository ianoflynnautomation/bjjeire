// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Net;
using BjjEire.Api.IntegrationTests.Data;
using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Api.IntegrationTests.TestBases;
using BjjEire.Domain.Enums;
using Shouldly;
using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.BjjEventController;

[Trait("Category", "Parallel")]
[Trait("Category", "BjjEvent")]
public class DeletejjEventControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ParallelTestBase(fixture, output) {

    [Fact]
    public async Task DeleteBjjEvent_WithValidId_ShouldDeleteBjjEvent() {
        // Arrange
        await Auth.SetDefaultUserAuthTokenAsync();
        var bjjevent1 = BjjEventTestDataFactory.CreateBjjEvent(g => g.Status = EventStatus.Upcoming);
        await Database.SeedEntitiesAsync(bjjevent1);

        // Act
        var response = await Http.DeleteAsync($"/api/bjjevent/{bjjevent1.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteBjjEvent_WithoutAuthentication_ShouldReturnUnauthorized() {
        // Arrange
        var bjjevent1 = BjjEventTestDataFactory.CreateBjjEvent(g => g.Status = EventStatus.Upcoming);
        await Database.SeedEntitiesAsync(bjjevent1);
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await Http.DeleteAsync($"/api/bjjevent/{bjjevent1.Id}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }


}