using BjjWorld.Domain.Entities.Common;

namespace BjjWorld.Application.Features.GymOpenMats.DTOs;

public class GymLocationDto
{
    public string Address { get; set; }= string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; }= string.Empty;
    public string? PostalCode { get; set; }
}

public class LocationMapping : Profile
{
    public LocationMapping()
    {
        CreateMap<Location, GymLocationDto>();
        CreateMap<GymLocationDto, Location>();
    }
}