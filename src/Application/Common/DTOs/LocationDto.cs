
using BjjWorld.Domain.Entities.Common;

namespace BjjWorld.Application.Common.DTOs;

public class LocationDto
{
    public string Address { get; set; } = string.Empty;

    public string Venue { get; set; } = string.Empty;

    public GeoCoordinatesDto Coordinates { get; set; } = new();

}

public class LocationMapping : Profile
{
    public LocationMapping()
    {
        CreateMap<Location, LocationDto>();
        CreateMap<LocationDto, Location>();
    }
}