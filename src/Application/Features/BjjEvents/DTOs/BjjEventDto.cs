using BjjWorld.Application.Common;
using BjjWorld.Application.Common.DTOs;
using BjjWorld.Domain.Entities.BjjEvents;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Application.Features.BjjEvents.DTOs;

public class BjjEventDto : BaseApiEntityModel
{
    public string Name { get; set; } = string.Empty;

    public BjjEventType Type { get; set; }

    public string EventUrl { get; set; }= string.Empty;

    public string Organiser {get; set;} = string.Empty;

    public bool IsActive { get; set; } = true;

    public string? StatusReason { get; set; }

    public string Address { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public ContactDto Contact { get; set; } = new();

    public BjjEventScheduleDto Schedule { get; set; } = null!;

    public GeoCoordinatesDto Coordinates { get; set; } = new();

    public BjjEventPricingModelDto Pricing { get; set; } = new();

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