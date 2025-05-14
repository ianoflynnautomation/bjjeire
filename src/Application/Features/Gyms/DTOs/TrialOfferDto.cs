using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Features.Gyms.DTOs;

public class TrialOfferDto
{
    public bool IsAvailable { get; set; } = false;
    public int? FreeClasses { get; set; }
    public int? FreeDays { get; set; } 
    public string? Notes { get; set; } 
}

public class TrialOfferDtoMapping : Profile
{
    public TrialOfferDtoMapping()
    {
        _ = CreateMap<TrialOffer, TrialOfferDto>();
        _ = CreateMap<TrialOfferDto, TrialOffer>();
    }
}