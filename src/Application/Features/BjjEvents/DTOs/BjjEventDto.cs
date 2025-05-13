using BjjWorld.Application.Common;
using BjjWorld.Application.Common.DTOs;
using BjjWorld.Domain.Entities.BjjEvents;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Application.Features.BjjEvents.DTOs;

public class BjjEventDto : BaseApiEntityModel
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; } = string.Empty;

    public BjjEventType Type { get; set; }

    public OrganizerDto Organiser { get; set; } = new();

    public EventStatus Status { get; set; }

    public string? StatusReason { get; set; }

    public SocialMediaDto SocialMedia { get; set; } = new();

    public string County { get; set; } = string.Empty;

    public LocationDto Location { get; set; } = new();

    public BjjEventScheduleDto Schedule { get; set; } = null!;

    public BjjEventPricingModelDto Pricing { get; set; } = new();

    public string EventUrl { get; set; } = string.Empty;

    public string ImageUrl { get; set; } = string.Empty;

}

public class BjjEventMapping : Profile
{
    public BjjEventMapping()
    {
        CreateMap<BjjEvent, BjjEventDto>()
          .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
          .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
        CreateMap<BjjEventDto, BjjEvent>()
            .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
            .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
    }
}