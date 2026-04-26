// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Core.Fixtures;

public abstract class DatabaseBaseFixture<T>
{

    public T Container = default!;

    public abstract Task StartContainerAsync();

    public abstract Task DisposeAsync();

    public abstract Task StopContainerAsync();


}
