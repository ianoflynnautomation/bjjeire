// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.Domain.Entities.BjjEvents;

public class BjjEventHours
{
    [BsonElement("day")]
    public DayOfWeek Day { get; set; }

    [BsonElement("openTime")]
    public TimeSpan OpenTime { get; set; }

    [BsonElement("closeTime")]
    public TimeSpan CloseTime { get; set; }
}
