using BjjEire.Domain.Entities.Common;

namespace BjjEire.Application.Common.DTOs;

public class GeoCoordinatesDto
{
    public string Type { get; set; } = "Point";

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string? PlaceName { get; set; }

    public string? PlaceId { get; set; }
}

public class GeoCoordinatesMapping : Profile
{
    public GeoCoordinatesMapping()
    {
        _ = CreateMap<GeoCoordinates, GeoCoordinatesDto>();
        _ = CreateMap<GeoCoordinatesDto, GeoCoordinates>();
    }
}
