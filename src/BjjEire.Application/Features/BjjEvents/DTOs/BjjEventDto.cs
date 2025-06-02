using BjjEire.Application.Common;
using BjjEire.Application.Common.DTOs;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.BjjEvents.DTOs;

public class BjjEventDto : BaseApiEntityModel
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; } = string.Empty;

    public BjjEventType Type { get; set; }

    public OrganizerDto Organiser { get; set; } = new();

    public EventStatus Status { get; set; }

    public string? StatusReason { get; set; }

    public SocialMediaDto SocialMedia { get; set; } = new();

    public County County { get; set; }

    public LocationDto Location { get; set; } = new();

    public BjjEventScheduleDto Schedule { get; set; } = null!;

    public PricingModelDto Pricing { get; set; } = new();

    public string EventUrl { get; set; } = string.Empty;

    public string ImageUrl { get; set; } = string.Empty;

}

public class BjjEventMapping : Profile
{
    public BjjEventMapping()
    {
        _ = CreateMap<BjjEvent, BjjEventDto>()
          .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
          .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
        _ = CreateMap<BjjEventDto, BjjEvent>()
            .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
            .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
    }
}
