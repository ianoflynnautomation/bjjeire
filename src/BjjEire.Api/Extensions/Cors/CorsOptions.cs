// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Api.Extensions.Cors;

public sealed class CorsOptions
{
    public const string SectionName = "CorsOptions";

    public string[] AllowedOrigins { get; init; } = [];
    public string[] AllowedMethods { get; init; } = [];
    public string[] AllowedHeaders { get; init; } = [];
}
