namespace BjjEire.Application.IntegrationTests.Gyms.CommandTests;

[Collection(AppIntegrationCollection.Name)]
[Trait("Category", "Integration")]
public class DeleteGymCommandTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper)
    : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task DeleteGym_WithValidId_RemovesGymFromDatabase()
    {
        var created = await SendAsync(GymTestDataFactory.GetValidCreateGymCommand());
        var gymId = created.Data.Id!;

        var response = await SendAsync(new DeleteGymCommand { Id = gymId });

        response.IsSuccess.ShouldBeTrue();

        var fromDb = await FindAsync<Gym, GymDto>(gymId);
        fromDb.ShouldBeNull();
    }

    [Fact]
    public async Task DeleteGym_WithInvalidIdFormat_ThrowsValidationException()
    {
        var ex = await Should.ThrowAsync<ValidationException>(
            async () => await SendAsync(new DeleteGymCommand { Id = "not-a-valid-id" }));

        ex.Errors.ShouldNotBeEmpty();
    }
}
