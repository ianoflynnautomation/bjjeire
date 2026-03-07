// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.IntegrationTests.Fixtures;

public abstract class DatabaseBaseFixture<T>
{

    public T Container = default!;

    public abstract Task StartContainerAsync();

    public abstract Task DisposeAsync();

    public abstract Task StopContainerAsync();


}
