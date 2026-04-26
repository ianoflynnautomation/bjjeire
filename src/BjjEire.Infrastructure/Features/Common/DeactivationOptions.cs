// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Domain.Entities;

namespace BjjEire.Infrastructure.Features.Common;

public sealed class DeactivationOptions<TEntity> where TEntity : BaseEntity
{
    public TimeSpan Interval { get; set; } = TimeSpan.FromHours(24);

    public TimeSpan InitialDelay { get; set; } = TimeSpan.FromSeconds(30);
}
