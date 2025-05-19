
using BjjEire.Domain.Enums;

namespace BjjEire.Domain.Entities.BjjEvents;

public class BjjEventSchedule
{
    [BsonElement("scheduleType")]
    public ScheduleType ScheduleType { get; set; }

    [BsonElement("startDate")]
    public DateTime? StartDate { get; set; }

    [BsonElement("endDate")]
    public DateTime? EndDate { get; set; }

    [BsonElement("hours")]
    public List<BjjEventHours>? Hours { get; init; }
}
