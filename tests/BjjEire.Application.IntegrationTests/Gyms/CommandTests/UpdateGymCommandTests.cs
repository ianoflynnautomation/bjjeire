namespace BjjEire.Application.IntegrationTests.Gyms.CommandTests;

[Collection(GymApplicationCollection.Name)]
[Trait("Feature", "Gyms")]
[Trait("Category", "Integration")]
public class UpdateGymCommandTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper)
    : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task UpdateGym_WithValidData_PersistsChanges()
    {
        CreateGymResponse created = await SendAsync(GymTestDataFactory.GetValidCreateGymCommand());
        string gymId = created.Data.Id!;

        GymDto updatedDto = GymTestDataFactory.GetValidGymDto();
        updatedDto.Id = gymId;
        updatedDto.Name = "Updated BJJ Academy";

        UpdateGymResponse response = await SendAsync(new UpdateGymCommand { Data = updatedDto });

        response.Data.Name.ShouldBe("Updated BJJ Academy");

        GymDto? fromDb = await FindAsync<Gym, GymDto>(gymId);
        fromDb.ShouldNotBeNull();
        fromDb.Name.ShouldBe("Updated BJJ Academy");
    }

    [Fact]
    public async Task UpdateGym_WithNullData_ThrowsValidationException()
    {
        ValidationException ex = await Should.ThrowAsync<ValidationException>(
            async () => await SendAsync(new UpdateGymCommand { Data = null! }));

        ex.Errors.ShouldNotBeEmpty();
    }
}
