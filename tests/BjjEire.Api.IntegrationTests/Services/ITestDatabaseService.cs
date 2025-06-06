// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Domain.Entities;

namespace BjjEire.Api.IntegrationTests.Services;

public interface ITestDatabaseService
{
    Task ClearCollectionsAsync();
    Task SeedEntitiesAsync<TEntity>(params TEntity[] entities) where TEntity : BaseEntity;
}
