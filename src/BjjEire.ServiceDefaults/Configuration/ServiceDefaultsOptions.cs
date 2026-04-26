// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.ServiceDefaults.Configuration;

public class ServiceDefaultsOptions
{
    public string? ServiceName { get; set; }
    public bool EnablePrometheus { get; set; } = true;
    public IReadOnlyList<string>? AllowedSchemes { get; set; }
}
