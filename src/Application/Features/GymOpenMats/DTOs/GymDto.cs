using BjjWorld.Application.Common;
using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Features.GymOpenMats.DTOs;

public class GymDto : BaseApiEntityModel
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string? StatusReason { get; set; }
    public string? Description { get; set; }
    public string? Affiliation { get; set; }
    public List<GymOpeningHoursDto> OpeningHours { get; set; } = [];
    public GymLocationDto Address { get; set; } = new();
    public GeoCoordinatesDto? Coordinates { get; set; } = new();
    public ContactDto Contact { get; set; } = new();
}

public class GymMapping : Profile
{
    public GymMapping()
    {
        CreateMap<GymDto, Gym>()
        .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
        .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
        CreateMap<Gym, GymDto>()
        .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
        .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
    }
}