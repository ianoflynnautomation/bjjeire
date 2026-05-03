// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.IntegrationTests.Support;

internal static class ApiRoutes
{
    public const string ApiVersion = "v1";
    public const string ApiBase = $"/api/{ApiVersion}";

    public const string BjjEvents = $"{ApiBase}/bjjevent";
    public const string Competitions = $"{ApiBase}/competition";
    public const string FeatureFlags = $"{ApiBase}/featureflag";
    public const string Gyms = $"{ApiBase}/gym";
    public const string Stores = $"{ApiBase}/store";

    public const string OpenApiDocument = $"/openapi/{ApiVersion}.json";
}
