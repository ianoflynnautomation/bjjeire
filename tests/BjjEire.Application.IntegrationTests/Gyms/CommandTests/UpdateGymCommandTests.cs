namespace BjjEire.Application.IntegrationTests.Gyms.CommandTests;

[Collection(AppIntegrationCollection.Name)]
[Trait("Category", "Integration")]
public class UpdateGymCommandTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper)
    : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task UpdateGym_WithValidData_PersistsChanges()
    {
        var created = await SendAsync(GymTestDataFactory.GetValidCreateGymCommand());
        var gymId = created.Data.Id!;

        var updatedDto = GymTestDataFactory.GetValidGymDto();
        updatedDto.Id = gymId;
        updatedDto.Name = "Updated BJJ Academy";

        var response = await SendAsync(new UpdateGymCommand { Data = updatedDto });

        response.Data.Name.ShouldBe("Updated BJJ Academy");

        var fromDb = await FindAsync<Gym, GymDto>(gymId);
        fromDb.ShouldNotBeNull();
        fromDb.Name.ShouldBe("Updated BJJ Academy");
    }

    [Fact]
    public async Task UpdateGym_WithNullData_ThrowsValidationException()
    {
        var ex = await Should.ThrowAsync<ValidationException>(
            async () => await SendAsync(new UpdateGymCommand { Data = null! }));

        ex.Errors.ShouldNotBeEmpty();
    }
}
