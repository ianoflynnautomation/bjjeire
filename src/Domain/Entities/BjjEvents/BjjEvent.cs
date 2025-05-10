
using BjjWorld.Domain.Entities.Common;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Domain.Entities.BjjEvents;

public class BjjEvent : BaseEntity
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("type")]
    public BjjEventType Type { get; set; }

    [BsonElement("eventUrl")]
    public string? EventUrl { get; set; }

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;
    [BsonElement("statusReason")]
    public string? StatusReason { get; set; }
    [BsonElement("pricing")]
    public PricingModel? Pricing { get; set; }
    [BsonElement("address")]
    public string Address { get; set; } = string.Empty;
    [BsonElement("city")]
    public string City { get; set; } = string.Empty;
    [BsonElement("schedule")]
     public BjjEventSchedule Schedule { get; set; } = null!;
    [BsonElement("contact")]
    public Contact Contact { get; set; } = new();
    [BsonElement("coordinates")]
    public GeoCoordinates Coordinates { get; set; } = new();

}