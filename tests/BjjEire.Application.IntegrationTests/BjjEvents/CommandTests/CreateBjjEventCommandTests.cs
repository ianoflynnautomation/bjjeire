// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Application.IntegrationTests.BjjEvents.CommandTests;

[Collection(BjjEventApplicationCollection.Name)]
[Trait("Feature", "BjjEvents")]
[Trait("Category", "Integration")]
public class CreateBjjEventCommandTests(CustomApiFactory apiFactory, ITestOutputHelper outputHelper)
    : ApplicationTestBase(apiFactory, outputHelper)
{
    [Fact]
    public async Task CreateBjjEvent_WithValidData_PersistsEventAsync()
    {
        CreateBjjEventCommand command = BjjEventTestDataFactory.GetValidBjjEventCommand();

        CreateBjjEventResponse response = await SendAsync(command);

        response.ShouldNotBeNull();
        response.Data.ShouldNotBeNull();
        response.Data.Name.ShouldBe(command.Data.Name);
        response.Data.Id.ShouldNotBeNullOrWhiteSpace();

        BjjEventDto? fromDb = await FindAsync<BjjEvent, BjjEventDto>(response.Data.Id!);
        fromDb.ShouldNotBeNull();
        fromDb.Name.ShouldBe(command.Data.Name);
    }

    [Fact]
    public async Task CreateBjjEvent_WithNullData_ThrowsValidationException()
    {
        ValidationException ex = await Should.ThrowAsync<ValidationException>(
            async () => await SendAsync(new CreateBjjEventCommand { Data = null! }));

        ex.Errors.ShouldNotBeEmpty();
        ex.Errors.ShouldHaveSingleItem();
        ex.Errors.First().PropertyName.ShouldBe("Data");
    }
}
