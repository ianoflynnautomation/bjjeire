// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.Extensions.ReadOnlyMode;

public sealed class ReadOnlyModeOptions
{
    public const string SectionName = "ReadOnlyMode";

    public bool Enabled { get; set; } = true;
}
