// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Fixtures;

using Xunit;

namespace BjjEire.Api.IntegrationTests.Attributes;

[CollectionDefinition("Parallel", DisableParallelization = false)]
public class ParallelCollectionDefinition : ICollectionFixture<ApiTestFixture> { }
