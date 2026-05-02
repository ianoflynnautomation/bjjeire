// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.IntegrationTests.OpenApiContractTests.Support;

using Xunit;

internal static class OpenApiContractCases
{
    public static TheoryData<string, string, string, bool> PublishedDtoFields => new()
    {
        { "GymDto", "name", "string", false },
        { "GymDto", "description", "string", true },
        { "GymDto", "status", "string", false },
        { "GymDto", "county", "string", false },
        { "GymDto", "affiliation", "object", true },
        { "GymDto", "trialOffer", "object", false },
        { "GymDto", "location", "object", false },
        { "GymDto", "socialMedia", "object", false },
        { "GymDto", "offeredClasses", "array", false },
        { "GymDto", "website", "string", true },
        { "GymDto", "timetableUrl", "string", true },
        { "GymDto", "imageUrl", "string", true },
        { "GymDto", "id", "string", false },
        { "BjjEventDto", "name", "string", false },
        { "BjjEventDto", "description", "string", true },
        { "BjjEventDto", "type", "string", false },
        { "BjjEventDto", "organiser", "object", false },
        { "BjjEventDto", "status", "string", false },
        { "BjjEventDto", "statusReason", "string", true },
        { "BjjEventDto", "socialMedia", "object", false },
        { "BjjEventDto", "county", "string", false },
        { "BjjEventDto", "location", "object", false },
        { "BjjEventDto", "schedule", "object", false },
        { "BjjEventDto", "pricing", "object", false },
        { "BjjEventDto", "eventUrl", "string", false },
        { "BjjEventDto", "imageUrl", "string", false },
        { "BjjEventDto", "id", "string", false },
        { "CompetitionDto", "slug", "string", false },
        { "CompetitionDto", "name", "string", false },
        { "CompetitionDto", "description", "string", true },
        { "CompetitionDto", "organisation", "string", false },
        { "CompetitionDto", "country", "string", false },
        { "CompetitionDto", "websiteUrl", "string", false },
        { "CompetitionDto", "registrationUrl", "string", true },
        { "CompetitionDto", "logoUrl", "string", true },
        { "CompetitionDto", "tags", "array", false },
        { "CompetitionDto", "startDate", "string", true },
        { "CompetitionDto", "endDate", "string", true },
        { "CompetitionDto", "isActive", "boolean", false },
        { "CompetitionDto", "id", "string", false },
        { "StoreDto", "name", "string", false },
        { "StoreDto", "description", "string", true },
        { "StoreDto", "websiteUrl", "string", false },
        { "StoreDto", "logoUrl", "string", true },
        { "StoreDto", "isActive", "boolean", false },
        { "StoreDto", "id", "string", false },
    };

    public static TheoryData<string, string> PagedResponseEndpoints => new()
    {
        { "/api/v1/gym", "PagedResponseOfGymDto" },
        { "/api/v1/bjjevent", "PagedResponseOfBjjEventDto" },
        { "/api/v1/competition", "PagedResponseOfCompetitionDto" },
        { "/api/v1/store", "PagedResponseOfStoreDto" },
    };
}
