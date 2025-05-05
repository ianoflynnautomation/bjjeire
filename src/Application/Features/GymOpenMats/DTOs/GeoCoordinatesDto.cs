using BjjWorld.Domain.Entities.Common;

namespace BjjWorld.Application.Features.GymOpenMats.DTOs;

public class GeoCoordinatesDto
{
    public string Type { get; set; } = "Point";
    public List<double>? Coordinates { get; set; } = null;
}

public class GeoCoordinatesMapping : Profile
{
    public GeoCoordinatesMapping()
    {
        CreateMap<GeoCoordinates, GeoCoordinatesDto>();
        CreateMap<GeoCoordinatesDto, GeoCoordinates>();
    }
}