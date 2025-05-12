using BjjWorld.Domain.Entities.Common;

namespace BjjWorld.Application.Common.DTOs;

public class SocialMediaDto
{
    public string Instagram { get; set; } = string.Empty;
    public string Facebook { get; set; } = string.Empty;
    public string X { get; set; } = string.Empty;
    public string YouTube { get; set; } = string.Empty;
}

public class SocialMediaMapping : Profile
{
    public SocialMediaMapping()
    {
        CreateMap<SocialMedia, SocialMediaDto>();
        CreateMap<SocialMediaDto, SocialMedia>();
    }
}