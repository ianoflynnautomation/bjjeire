namespace BjjWorld.Domain.Entities.Gyms;

public class TrialOffer
{
    [BsonElement("isAvailable")]
    public bool IsAvailable { get; set; } = false;
    [BsonElement("freeClasses")]
    public int? FreeClasses { get; set; }
    [BsonElement("freeDays")]
    public int? FreeDays { get; set; }
    [BsonElement("notes")]
    public string? Notes { get; set; }
}
