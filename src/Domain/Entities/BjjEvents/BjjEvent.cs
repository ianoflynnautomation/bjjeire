
using BjjWorld.Domain.Entities.Common;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Domain.Entities.BjjEvents;

public class BjjEvent : BaseEntity
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;
    [BsonElement("description")]
    public string? Description { get; set; } = string.Empty;

    [BsonElement("type")]
    public BjjEventType Type { get; set; }

    [BsonElement("organiser")]
    public Organizer Organiser { get; set; } = new();
    [BsonElement("status")]
    public EventStatus Status { get; set; }

    [BsonElement("statusReason")]
    public string? StatusReason { get; set; }

    [BsonElement("socialMedia")]
    public SocialMedia SocialMedia { get; set; } = new();

    [BsonElement("region")]
    public string Region { get; set; } = string.Empty;

    [BsonElement("city")]
    public string City { get; set; } = string.Empty;

    [BsonElement("location")]
    public Location Location { get; set; } = new();
    [BsonElement("schedule")]
    public BjjEventSchedule Schedule { get; set; } = null!;
    [BsonElement("pricing")]
    public PricingModel? Pricing { get; set; }

    [BsonElement("eventUrl")]
    public string EventUrl { get; set; } = string.Empty;
    [BsonElement("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;

}