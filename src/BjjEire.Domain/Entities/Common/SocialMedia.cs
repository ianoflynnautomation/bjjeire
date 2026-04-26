// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.Domain.Entities.Common;

public class SocialMedia
{
    [BsonElement("instagram")]
    public string? Instagram { get; set; } = string.Empty;

    [BsonElement("facebook")]
    public string? Facebook { get; set; } = string.Empty;

    [BsonElement("x")]
    public string? X { get; set; } = string.Empty;

    [BsonElement("youTube")]
    public string? YouTube { get; set; } = string.Empty;
}
