// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Application.IntegrationTests.BjjEvents.CommandTests;

[Collection(BjjEventApplicationCollection.Name)]
[Trait("Feature", "BjjEvents")]
[Trait("Category", "Integration")]
public class UpdateBjjEventCommandTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper)
    : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task UpdateBjjEvent_WithValidData_PersistsChanges()
    {
        CreateBjjEventResponse created = await SendAsync(BjjEventTestDataFactory.GetValidBjjEventCommand());
        string eventId = created.Data.Id!;

        BjjEventDto updatedDto = BjjEventTestDataFactory.GetValidBjjEventDto();
        updatedDto.Id = eventId;
        updatedDto.Name = "Updated Dublin BJJ Seminar";

        UpdateBjjEventResponse response = await SendAsync(new UpdateBjjEventCommand { Data = updatedDto });

        response.Data.Name.ShouldBe("Updated Dublin BJJ Seminar");

        BjjEventDto? fromDb = await FindAsync<BjjEvent, BjjEventDto>(eventId);
        fromDb.ShouldNotBeNull();
        fromDb.Name.ShouldBe("Updated Dublin BJJ Seminar");
    }

    [Fact]
    public async Task UpdateBjjEvent_WithNullData_ThrowsValidationException()
    {
        ValidationException ex = await Should.ThrowAsync<ValidationException>(
            async () => await SendAsync(new UpdateBjjEventCommand { Data = null! }));

        ex.Errors.ShouldNotBeEmpty();
    }
}
