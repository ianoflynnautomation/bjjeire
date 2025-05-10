using System.Text.Json.Serialization;
using BjjWorld.Application.Common;
using BjjWorld.Application.Common.DTOs;
using BjjWorld.Domain.Entities.Gyms;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Application.Features.Gyms.DTOs;

public class GymDto : BaseApiEntityModel
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public string? StatusReason { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public List<ClassCategory> OfferedClasses { get; set; } = [];

    public GeoCoordinatesDto Coordinates { get; set; } = new();

    public ContactDto Contact { get; set; } = new();

     public string? ImageUrl { get; set; } 

}


public class GymtDtoMapping : Profile
{
    public GymtDtoMapping()
    {
        CreateMap<Gym, GymDto>()
          .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
          .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
        CreateMap<GymDto, Gym>()
            .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
            .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
    }
}