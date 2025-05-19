
using BjjEire.Domain.Entities.Common;

namespace BjjEire.Application.Common.DTOs;

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
        _ = CreateMap<Location, LocationDto>();
        _ = CreateMap<LocationDto, Location>();
    }
}