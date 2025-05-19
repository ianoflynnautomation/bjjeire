using BjjEire.Application.Common;
using BjjEire.Application.Common.DTOs;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.Gyms.DTOs;

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

        _ = CreateMap<Gym, GymDto>()
            .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
            .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
        _ = CreateMap<GymDto, Gym>()
            .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
            .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
    }
}