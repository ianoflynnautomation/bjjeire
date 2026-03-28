namespace BjjEire.Domain.Entities.Common;

public class GeoCoordinates
{
    [BsonElement("type")]
    public string Type { get; } = "Point";

    /// <summary>[longitude, latitude] — GeoJSON / MongoDB order.</summary>
    [BsonElement("coordinates")]
    public double[] Coordinates { get; set; } = [0, 0];

    [BsonElement("placeName")]
    public string? PlaceName { get; set; }

    [BsonElement("placeId")]
    public string? PlaceId { get; set; }
}
