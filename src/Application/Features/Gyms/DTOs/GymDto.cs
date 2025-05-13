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
// public class GeoCoordinatesDto
// {
//     public string Type { get; set; } = "Point";

//     public double Latitude { get; set; }

//     public double Longitude { get; set; }

//     public string? PlaceName { get; set; }

//     public string? PlaceId { get; set; }
// }


// public class LocationDto
// {
//     public string Address { get; set; } = string.Empty;

//     public string Venue { get; set; } = string.Empty;

//     public GeoCoordinatesDto Coordinates { get; set; } = new();

// }
// public class TrialOfferDto
// {
//     public bool IsAvailable { get; set; } = false;
//     public int? FreeClasses { get; set; }
//     public int? FreeDays { get; set; } 
//     public string? Notes { get; set; } 
// }

// public class AffiliationDto
// {
//     public string Name { get; set; } = string.Empty;
//     public string? Website { get; set; }
// }



// public class SocialMediaDto
// {
//     public string Instagram { get; set; } = string.Empty;
//     public string Facebook { get; set; } = string.Empty;
//     public string X { get; set; } = string.Empty;
//     public string YouTube { get; set; } = string.Empty;
// }

// public enum ClassCategory
// {
//     Uncategorized = 0,
//     BJJGiAllLevels = 1,
//     BJJNoGiAllLevels = 2,
//     WomensOnly = 3,
//     Wrestling = 4,
//     MuayThai = 5,
//     Boxing = 6,
//     StrengthTraining = 7,
//     YogaOrPilates = 8,
//     KidsBJJ = 9,

//     BJJGiFundamentals = 10,
//     BJJGiAdvanced = 11,
//     BJJNoGiFundamentals = 12,
//     BJJNoGiAdvanced = 13,
//     CompetitionTraining = 14,
//     ProTraining = 15,

//     Other = 99
// }

// public enum GymStatus
// {
//     Active = 0,
//     PendingApproval = 1,
//     TemporarilyClosed = 2,
//     PermanentlyClosed = 3, 
//     OpeningSoon = 4,     
//     Draft = 7,    
//     Rejected = 8  

// }

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