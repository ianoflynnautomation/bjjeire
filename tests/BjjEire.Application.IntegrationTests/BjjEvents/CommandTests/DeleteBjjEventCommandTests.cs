namespace BjjEire.Application.IntegrationTests.BjjEvents.CommandTests;

[Collection(BjjEventApplicationCollection.Name)]
[Trait("Feature", "BjjEvents")]
[Trait("Category", "Integration")]
public class DeleteBjjEventCommandTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper)
    : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task DeleteBjjEvent_WithValidId_RemovesEventFromDatabase()
    {
        CreateBjjEventResponse created = await SendAsync(BjjEventTestDataFactory.GetValidBjjEventCommand());
        string eventId = created.Data.Id!;

        DeleteBjjEventResponse response = await SendAsync(new DeleteBjjEventCommand { Id = eventId });

        response.IsSuccess.ShouldBeTrue();

        BjjEventDto? fromDb = await FindAsync<BjjEvent, BjjEventDto>(eventId);
        fromDb.ShouldBeNull();
    }

    [Fact]
    public async Task DeleteBjjEvent_WithInvalidIdFormat_ThrowsValidationException()
    {
        ValidationException ex = await Should.ThrowAsync<ValidationException>(
            async () => await SendAsync(new DeleteBjjEventCommand { Id = "not-a-valid-id" }));

        ex.Errors.ShouldNotBeEmpty();
    }
}
