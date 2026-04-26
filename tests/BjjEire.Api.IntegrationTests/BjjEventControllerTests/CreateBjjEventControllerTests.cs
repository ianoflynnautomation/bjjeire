// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using System.Net;

using BjjEire.Api.IntegrationTests.Fixtures;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Domain.Enums;

using Shouldly;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.BjjEventControllerTests;

[Collection(BjjEventApiCollection.Name)]
[Trait("Feature", "BjjEvents")]
[Trait("Category", "Integration")]
public class CreateBjjEventControllerTests(ApiTestFixture fixture, ITestOutputHelper output)
    : ApiIntegrationTestBase(fixture, output)
{
    [Fact]
    public async Task CreateBjjEvent_WithValidData_ShouldCreateBjjEventAsync()
    {
        // Arrange
        SetDefaultUserToken();
        CreateBjjEventCommand command = BjjEventTestDataFactory.GetValidBjjEventCommand();

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("api/bjjevent", command, TestJsonHelper.SerializerOptions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        CreateBjjEventResponse createdBjjEventResponse = await ReadJsonAsync<CreateBjjEventResponse>(response);

        _ = createdBjjEventResponse.ShouldNotBeNull();
        _ = createdBjjEventResponse.Data.ShouldNotBeNull();
        createdBjjEventResponse.Data.ShouldBeEquivalentTo(command.Data);
    }

    [Fact]
    public async Task CreateBjjEvent_WithoutAuthentication_ShouldReturnUnauthorizedAsync()
    {
        // Arrange
        CreateBjjEventCommand command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        HttpClient.DefaultRequestHeaders.Authorization = null;

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("api/bjjevent", command, TestJsonHelper.SerializerOptions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateBjjEvent_WithInvalidPayload_ReturnsValidationErrorContractAsync()
    {
        // Arrange
        SetDefaultUserToken();
        CreateBjjEventCommand command = new()
        { Data = null! };

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("api/bjjevent", command, TestJsonHelper.SerializerOptions);

        // Assert
        await HttpResponseAssertions.AssertValidationErrorContractAsync(response);
    }

    [Fact]
    public async Task CreateBjjEvent_WithMultipleInvalidFields_ReturnsAllErrorsAsync()
    {
        // Arrange
        SetDefaultUserToken();
        CreateBjjEventCommand command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Name = "";
        command.Data.Organiser = null!;
        command.Data.Schedule = null!;
        command.Data.Pricing = null!;

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("api/bjjevent", command, TestJsonHelper.SerializerOptions);

        // Assert
        await AssertValidationErrorAsync(response,
            (Field: "Data.Name", ErrorCode: null, MessageContains: null),
            (Field: "Data.Organiser", ErrorCode: null, MessageContains: null),
            (Field: "Data.Schedule", ErrorCode: null, MessageContains: null),
            (Field: "Data.Pricing", ErrorCode: null, MessageContains: null)
        );
    }

    [Fact]
    public async Task CreateBjjEvent_SocialMediaOptionalUrls_AllowEmptyAndNullAsync()
    {
        // Arrange
        SetDefaultUserToken();
        CreateBjjEventCommand command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.SocialMedia.Facebook = null!;
        command.Data.SocialMedia.Instagram = string.Empty;
        command.Data.SocialMedia.X = null!;
        command.Data.SocialMedia.YouTube = string.Empty;

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("api/bjjevent", command, TestJsonHelper.SerializerOptions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateBjjEvent_FreePricing_ValidZeroAmountNullCurrencyAsync()
    {
        // Arrange
        SetDefaultUserToken();
        CreateBjjEventCommand command = BjjEventTestDataFactory.GetValidBjjEventCommand();
        command.Data.Pricing.Type = PricingType.Free;
        command.Data.Pricing.Amount = 0m;
        command.Data.Pricing.Currency = null;
        command.Data.Pricing.DurationDays = null;

        // Act
        HttpResponseMessage response = await HttpClient.PostAsJsonAsync("api/bjjevent", command, TestJsonHelper.SerializerOptions);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
    }
}
