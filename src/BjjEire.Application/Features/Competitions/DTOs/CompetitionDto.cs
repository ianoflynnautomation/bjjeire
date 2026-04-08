using BjjEire.Application.Common;
using BjjEire.Domain.Entities.Competitions;

namespace BjjEire.Application.Features.Competitions.DTOs;

public class CompetitionDto : BaseApiEntityModel
{
    public string Slug { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Organisation { get; set; } = string.Empty;

    public string Country { get; set; } = string.Empty;

    public string WebsiteUrl { get; set; } = string.Empty;

    public string? RegistrationUrl { get; set; }

    public string? LogoUrl { get; set; }

    public List<string> Tags { get; set; } = [];

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool IsActive { get; set; }
}

public class CompetitionDtoMapping : Profile
{
    public CompetitionDtoMapping()
    {
        _ = CreateMap<Competition, CompetitionDto>()
            .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
            .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
        _ = CreateMap<CompetitionDto, Competition>()
            .ForMember(dest => dest.CreatedOnUtc, mo => mo.Ignore())
            .ForMember(dest => dest.UpdatedOnUtc, mo => mo.Ignore());
    }
}
