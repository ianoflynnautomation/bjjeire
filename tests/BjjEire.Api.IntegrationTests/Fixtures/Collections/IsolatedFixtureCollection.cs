// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Xunit;

namespace BjjEire.Api.IntegrationTests.Fixtures.Collections;

// Collection for tests that spin up their own fixture/container per test method
// (IsolationTestBase, rate-limit tests). Parallelisation is disabled so we don't
// thrash Docker starting many containers concurrently.
#pragma warning disable CA1711
[CollectionDefinition(Name, DisableParallelization = true)]
public class IsolatedFixtureCollection
#pragma warning restore CA1711
{
    public const string Name = "Isolated Fixture";
}
