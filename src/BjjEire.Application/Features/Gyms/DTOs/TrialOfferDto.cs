using BjjEire.Domain.Entities.Gyms;

namespace BjjEire.Application.Features.Gyms.DTOs;

public class TrialOfferDto
{
    public bool IsAvailable { get; set; }
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
