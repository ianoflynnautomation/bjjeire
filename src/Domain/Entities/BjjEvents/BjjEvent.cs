
using BjjWorld.Domain.Entities.Enums;
using BjjWorld.Domain.Entities.Gyms;
using BjjWorld.Domain.Entities.Common;

namespace BjjWorld.Domain.Entities.BjjEvents;

public class BjjEvent : BaseEntity
{
    [BsonElement("name")]
    public string EventName { get; set; } = string.Empty;

    [BsonElement("type")]
    public BjjEventType Type { get; set; }

    [BsonElement("eventUrl")]
    public string? EventUrl { get; set; }

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;
    [BsonElement("statusReason")]
    public string? StatusReason { get; set; }
    [BsonElement("cost")]
    public decimal? Cost { get; set; }
    [BsonElement("address")]
    public string Address { get; set; } = string.Empty;
    [BsonElement("city")]
    public string City { get; set; } = string.Empty;
    [BsonElement("eventHours")]
    public List<BjjEventHours> EventHours { get; set; } = [];
    [BsonElement("contact")]
    public BjjEventContact Contact { get; set; } = new();
    [BsonElement("coordinates")]
    public GeoCoordinates Coordinates { get; set; } = new();

}