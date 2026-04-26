// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.Domain.Entities.BjjEvents;

public class Organizer
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("website")]
    public string Website { get; set; } = string.Empty;
}
