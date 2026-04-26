// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Domain.Entities;

public interface IAuditableEntity
{
    public DateTime CreatedOnUtc { get; set; }

    public string? CreatedBy { get; set; }

    public DateTime? UpdatedOnUtc { get; set; }

    public string? UpdatedBy { get; set; }
}
