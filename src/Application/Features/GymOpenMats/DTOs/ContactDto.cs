using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Features.GymOpenMats.DTOs;

public class ContactDto
{
    public string ContactPersom {get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public Dictionary<string, string>? SocialMedia { get; set; } = [];
}

public class ContactMapping : Profile
{
    public ContactMapping()
    {
        CreateMap<GymContact, ContactDto>();
        CreateMap<ContactDto, GymContact>();
    }
}