// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Application.IntegrationTests.Gyms.CommandTests;

[Collection(GymApplicationCollection.Name)]
[Trait("Feature", "Gyms")]
[Trait("Category", "Integration")]
public class CreateGymCommandTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper) : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task CreateGym_WithValidData_ShouldCreateGymAsync()
    {
        // Arrange
        CreateGymCommand command = GymTestDataFactory.GetValidCreateGymCommand();

        // Act
        CreateGymResponse response = await SendAsync(command);

        // Assert
        _ = response.ShouldNotBeNull();
        _ = response.Data.ShouldNotBeNull();
        response.Data.Name.ShouldBe(command.Data.Name);
        response.Data.Id.ShouldNotBeNullOrWhiteSpace();

        GymDto? createdGymDtoFromDb = await FindAsync<Gym, GymDto>(response.Data.Id!);
        _ = createdGymDtoFromDb.ShouldNotBeNull();
        createdGymDtoFromDb.ShouldBeEquivalentTo(command.Data);
    }

    [Fact]
    public async Task CreateGym_WithNullData_ShouldReturnBadRequestAsync()
    {
        // Arrange
        CreateGymCommand command = new()
        { Data = null! };

        // Act
        ValidationException exception = await Should.ThrowAsync<ValidationException>(async () => _ = await SendAsync(command).ConfigureAwait(false));

        // Assert
        exception.Errors.ShouldNotBeEmpty();
        _ = exception.Errors.ShouldHaveSingleItem();
        exception.Errors.First().PropertyName.ShouldBe("Data");
        exception.Errors.First().ErrorMessage.ShouldContain("cannot be null");

    }
}
