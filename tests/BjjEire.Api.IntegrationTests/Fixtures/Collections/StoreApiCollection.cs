// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Xunit;

namespace BjjEire.Api.IntegrationTests.Fixtures.Collections;

// One ApiTestFixture (= one Mongo container) shared by every Store API test class.
// Tests in this collection run sequentially against the shared DB; the collection
// itself runs in parallel with other feature collections.
#pragma warning disable CA1711
[CollectionDefinition(Name)]
public class StoreApiCollection : ICollectionFixture<ApiTestFixture>
#pragma warning restore CA1711
{
    public const string Name = "Store API";
}
