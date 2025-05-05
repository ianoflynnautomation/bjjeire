
namespace BjjWorld.Domain.Entities.Common;

public class GeoCoordinates
{
    public GeoCoordinates()
    {
        Type = "Point";
        Coordinates = [0, 0];
    }

    public GeoCoordinates(double longitude, double latitude)
    {
        Type = "Point";
        Coordinates = [longitude, latitude];
    }

    [BsonElement("type")]
    public string Type { get; private set; } = "Point";

    [BsonElement("coordinates")]
    public List<double> Coordinates { get; set; }
}
