
using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Features.Gyms.DTOs;

public class AffiliationDto
{
    public string Name { get; set; } = string.Empty;
    public string? Website { get; set; }
}

public class AffiliationDtoMapping : Profile
{
    public AffiliationDtoMapping()
    {
        CreateMap<Affiliation, AffiliationDto>();
        CreateMap<AffiliationDto, Affiliation>();
    }
}