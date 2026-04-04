using BjjEire.Domain.Entities.Common;

namespace BjjEire.Application.Common.DTOs;

public class GeoCoordinatesDto
{
    public string Type { get; set; } = "Point";

    public double[] Coordinates { get; set; } = [0.0, 0.0];


    public double Latitude => Coordinates.Length > 1 ? Coordinates[1] : 0.0;
    public double Longitude => Coordinates.Length > 0 ? Coordinates[0] : 0.0;

    public string? PlaceName { get; set; }

    public string? PlaceId { get; set; }
}

public class GeoCoordinatesMapping : Profile
{
    public GeoCoordinatesMapping()
    {
        _ = CreateMap<GeoCoordinates, GeoCoordinatesDto>()
            .ForMember(dest => dest.Latitude, mo => mo.Ignore())
            .ForMember(dest => dest.Longitude, mo => mo.Ignore());
        _ = CreateMap<GeoCoordinatesDto, GeoCoordinates>();
    }
}
