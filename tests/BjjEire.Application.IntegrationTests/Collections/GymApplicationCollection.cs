// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Application.IntegrationTests.Collections;

// One CustomApiFactory (= one Mongo container) shared by every Gym application
// integration test class. Tests in this collection run sequentially against the
// shared DB; the collection itself runs in parallel with other feature collections.
#pragma warning disable CA1711
[CollectionDefinition(Name)]
public class GymApplicationCollection : ICollectionFixture<CustomApiFactory>
#pragma warning restore CA1711
{
    public const string Name = "Gym Application";
}
