// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.Domain.Entities.BjjEvents;

public class BjjEventSchedule
{
    [BsonElement("startDate")]
    public DateTime? StartDate { get; set; }

    [BsonElement("endDate")]
    public DateTime? EndDate { get; set; }

    [BsonElement("hours")]
    public List<BjjEventHours>? Hours { get; init; }
}
