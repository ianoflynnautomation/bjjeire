// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Fixtures;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.TestBases;

/// <summary>
/// Base class for parallel integration tests. Inherits helpers from ApiIntegrationTestBase
/// and uses IClassFixture for a shared database container per test class.
/// </summary>
[Collection("Parallel")]
public class ParallelTestBase(ApiTestFixture fixture, ITestOutputHelper output)
    : ApiIntegrationTestBase(fixture, output);
