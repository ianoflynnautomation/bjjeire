// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Application.IntegrationTests.Collections;

// One CustomApiFactory (= one Mongo container) shared by every BjjEvent application
// integration test class. Tests in this collection run sequentially against the
// shared DB; the collection itself runs in parallel with other feature collections.
#pragma warning disable CA1711
[CollectionDefinition(Name)]
public class BjjEventApplicationCollection : ICollectionFixture<CustomApiFactory>
#pragma warning restore CA1711
{
    public const string Name = "BjjEvent Application";
}
