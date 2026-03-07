// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Fixtures;

using Xunit;

namespace BjjEire.Api.IntegrationTests.Attributes;

[CollectionDefinition("Sequential", DisableParallelization = true)]
public class SequentialCollectionDefinition : ICollectionFixture<ApiTestFixture> { }
