namespace BjjEire.Application.IntegrationTests.BjjEvents.CommandTests;

[Collection(AppIntegrationCollection.Name)]
[Trait("Category", "Integration")]
public class UpdateBjjEventCommandTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper)
    : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task UpdateBjjEvent_WithValidData_PersistsChanges()
    {
        var created = await SendAsync(BjjEventTestDataFactory.GetValidBjjEventCommand());
        var eventId = created.Data.Id!;

        var updatedDto = BjjEventTestDataFactory.GetValidBjjEventDto();
        updatedDto.Id = eventId;
        updatedDto.Name = "Updated Dublin BJJ Seminar";

        var response = await SendAsync(new UpdateBjjEventCommand { Data = updatedDto });

        response.Data.Name.ShouldBe("Updated Dublin BJJ Seminar");

        var fromDb = await FindAsync<BjjEvent, BjjEventDto>(eventId);
        fromDb.ShouldNotBeNull();
        fromDb.Name.ShouldBe("Updated Dublin BJJ Seminar");
    }

    [Fact]
    public async Task UpdateBjjEvent_WithNullData_ThrowsValidationException()
    {
        var ex = await Should.ThrowAsync<ValidationException>(
            async () => await SendAsync(new UpdateBjjEventCommand { Data = null! }));

        ex.Errors.ShouldNotBeEmpty();
    }
}
