using BjjEire.Domain.Entities.Common;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.BjjEvents.DTOs;

public class PricingModelDto {
    public PricingType Type { get; set; }

    public decimal Amount { get; set; }

    public int? DurationDays { get; set; }

    public string? Currency { get; set; } = "EUR";
}

public class PricingModelMapping : Profile {
    public PricingModelMapping() {
        _ = CreateMap<PricingModel, PricingModelDto>();
        _ = CreateMap<PricingModelDto, PricingModel>();
    }
}
