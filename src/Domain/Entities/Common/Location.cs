
namespace BjjWorld.Domain.Entities.Common;

public class Location
{
    [BsonElement("address")]
    public  string Address { get; set; }= string.Empty;

    [BsonElement("venue")]
     public string Venue { get; set; } = string.Empty;

    [BsonElement("coordinates")]
    public GeoCoordinates Coordinates { get; set; } = new();
}

