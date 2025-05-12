using System.Text.Json.Serialization;
using BjjWorld.Domain.Entities.Common;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Domain.Entities.Gyms;

public class Gym : BaseEntity
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;
    [BsonElement("description")]
    public string? Description { get; set; } = string.Empty;
    [BsonElement("city")]
    public string City { get; set; } = string.Empty;
    [BsonElement("address")]
    public string Address { get; set; } = string.Empty;
    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;
    [BsonElement("statusReason")]
    public string? StatusReason { get; set; }
    [BsonElement("offeredClasses")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public List<ClassCategory> OfferedClasses { get; set; } = [];
    [BsonElement("coordinates")]
    public GeoCoordinates Coordinates { get; set; } = new();
    // [BsonElement("contact")]
    // public Contact Contact { get; set; } = new();
    [BsonElement("imageUrl")]
    public string? ImageUrl { get; set; }
}