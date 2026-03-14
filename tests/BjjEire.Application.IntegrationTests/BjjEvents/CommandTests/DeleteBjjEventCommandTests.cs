namespace BjjEire.Application.IntegrationTests.BjjEvents.CommandTests;

[Collection(AppIntegrationCollection.Name)]
[Trait("Category", "Integration")]
public class DeleteBjjEventCommandTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper)
    : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task DeleteBjjEvent_WithValidId_RemovesEventFromDatabase()
    {
        var created = await SendAsync(BjjEventTestDataFactory.GetValidBjjEventCommand());
        var eventId = created.Data.Id!;

        var response = await SendAsync(new DeleteBjjEventCommand { Id = eventId });

        response.IsSuccess.ShouldBeTrue();

        var fromDb = await FindAsync<BjjEvent, BjjEventDto>(eventId);
        fromDb.ShouldBeNull();
    }

    [Fact]
    public async Task DeleteBjjEvent_WithInvalidIdFormat_ThrowsValidationException()
    {
        var ex = await Should.ThrowAsync<ValidationException>(
            async () => await SendAsync(new DeleteBjjEventCommand { Id = "not-a-valid-id" }));

        ex.Errors.ShouldNotBeEmpty();
    }
}
