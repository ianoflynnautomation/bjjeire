using BjjWorld.Domain.Entities.Common;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Application.Features.BjjEvents.DTOs;

public class BjjEventPricingModelDto
{
    public PricingType Type { get; set; }
    public decimal Amount { get; set; }
    public int? DurationDays { get; set; }
    public string Currency { get; set; } = "EUR";
}

public class PricingModelMapping : Profile
{
    public PricingModelMapping()
    {
        CreateMap<PricingModel, BjjEventPricingModelDto>();
        CreateMap<BjjEventPricingModelDto, PricingModel>();
    }
}