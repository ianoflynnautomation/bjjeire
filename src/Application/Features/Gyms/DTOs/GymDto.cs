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

    public GymStatus Status { get; set; }

    public string County { get; set; } = string.Empty;

    public AffiliationDto? Affiliation { get; set; } = new();

    public TrialOfferDto TrialOffer { get; set; } = new();

    public LocationDto Location { get; set; } = new();

    public SocialMediaDto SocialMedia { get; set; } = new();

    public List<ClassCategory> OfferedClasses { get; set; } = [];

    public string? Website { get; set; }

    public string? TimetableUrl { get; set; }

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