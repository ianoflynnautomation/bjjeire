using BjjWorld.Domain.Entities.Common;

namespace BjjWorld.Application.Features.BjjEvents.DTOs;

public class GeoCoordinatesDto
{
    public string Type { get; set; } = "Point";

    public double Latitude  { get; set; }

    public double Longitude  { get; set; }

    public string? PlaceName { get; set; } 
    
    public string? PlaceId { get; set; } 
}

public class GeoCoordinatesMapping : Profile
{
    public GeoCoordinatesMapping()
    {
        CreateMap<GeoCoordinates, GeoCoordinatesDto>();
        CreateMap<GeoCoordinatesDto, GeoCoordinates>();
    }
}