
using BjjWorld.Domain.Entities.Common;

namespace BjjWorld.Domain.Entities.Gyms;

public class Gym : BaseEntity
{

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("statusReason")]
    public string? StatusReason { get; set; }

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("affiliation")]
    public string? Affiliation { get; set; }
    
    [BsonElement("openingHours")]
    public IList<GymOpeningHours> OpeningHours { get; set; } = [];

    [BsonElement("address")]
    public Location Address { get; set; } = new();

    [BsonElement("coordinates")]
    public GeoCoordinates? Coordinates { get; set; } = new();

    [BsonElement("contact")]
    public GymContact Contact { get; set; } = new();

}
