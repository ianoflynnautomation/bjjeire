
namespace BjjEire.Domain.Entities.Common;

public class GeoCoordinates
{

  [BsonElement("type")]
  public string Type { get; private set; } = "Point";

  [BsonElement("latitude")]
  public double Latitude { get; set; }

  [BsonElement("longitude")]
  public double Longitude { get; set; }

  [BsonElement("placeName")]
  public string? PlaceName { get; set; }
  
  [BsonElement("placeId")]
  public string? PlaceId { get; set; }
}
