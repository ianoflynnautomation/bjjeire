namespace BjjEire.Application.IntegrationTests.Gyms.CommandTests;

[Collection(GymApplicationCollection.Name)]
[Trait("Feature", "Gyms")]
[Trait("Category", "Integration")]
public class DeleteGymCommandTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper)
    : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task DeleteGym_WithValidId_RemovesGymFromDatabase()
    {
        CreateGymResponse created = await SendAsync(GymTestDataFactory.GetValidCreateGymCommand());
        string gymId = created.Data.Id!;

        DeleteGymResponse response = await SendAsync(new DeleteGymCommand { Id = gymId });

        response.IsSuccess.ShouldBeTrue();

        GymDto? fromDb = await FindAsync<Gym, GymDto>(gymId);
        fromDb.ShouldBeNull();
    }

    [Fact]
    public async Task DeleteGym_WithInvalidIdFormat_ThrowsValidationException()
    {
        ValidationException ex = await Should.ThrowAsync<ValidationException>(
            async () => await SendAsync(new DeleteGymCommand { Id = "not-a-valid-id" }));

        ex.Errors.ShouldNotBeEmpty();
    }
}
