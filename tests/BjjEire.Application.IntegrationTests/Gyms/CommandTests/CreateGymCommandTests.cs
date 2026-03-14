// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Application.IntegrationTests.Gyms.CommandTests;

[Collection(AppIntegrationCollection.Name)]
[Trait("Category", "Integration")]
public class CreateGymCommandTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper) : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task CreateGym_WithValidData_ShouldCreateGymAsync()
    {
        // Arrange
        var command = GymTestDataFactory.GetValidCreateGymCommand();

        // Act
        var response = await SendAsync(command);

        // Assert
        _ = response.ShouldNotBeNull();
        _ = response.Data.ShouldNotBeNull();
        response.Data.Name.ShouldBe(command.Data.Name);
        response.Data.Id.ShouldNotBeNullOrWhiteSpace();

        var createdGymDtoFromDb = await FindAsync<Gym, GymDto>(response.Data.Id!);
        _ = createdGymDtoFromDb.ShouldNotBeNull();
        createdGymDtoFromDb.ShouldBeEquivalentTo(command.Data);
    }

    [Fact]
    public async Task CreateGym_WithNullData_ShouldReturnBadRequestAsync()
    {
        // Arrange
        var command = new CreateGymCommand { Data = null! };

        // Act
        var exception = await Should.ThrowAsync<ValidationException>(async () => _ = await SendAsync(command).ConfigureAwait(false));

        // Assert
        exception.Errors.ShouldNotBeEmpty();
        _ = exception.Errors.ShouldHaveSingleItem();
        exception.Errors.First().PropertyName.ShouldBe("Data");
        exception.Errors.First().ErrorMessage.ShouldContain("cannot be null");

    }
}
