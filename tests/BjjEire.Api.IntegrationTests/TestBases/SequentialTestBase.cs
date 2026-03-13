// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Fixtures;

using Xunit;
using Xunit.Abstractions;

namespace BjjEire.Api.IntegrationTests.TestBases;

/// <summary>
/// A high-performance base class for tests that must run sequentially.
/// It uses one database container per test CLASS, but ensures the classes themselves
/// do not run in parallel. This is the recommended approach for most sequential tests.
/// </summary>
[Collection("Sequential")]
public class SequentialTestBase(ApiTestFixture fixture, ITestOutputHelper output)
    : ApiIntegrationTestBase(fixture, output);
