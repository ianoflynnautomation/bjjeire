
using BjjWorld.Domain.Entities.BjjEvents;

namespace BjjWorld.Application.Features.BjjEvents.DTOs;

public class ContactDto
{
    public string ContactPerson {get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public Dictionary<string, string>? SocialMedia { get; set; } = [];
}

public class ContactMapping : Profile
{
    public ContactMapping()
    {
        CreateMap<BjjEventContact, ContactDto>();
        CreateMap<ContactDto, BjjEventContact>();
    }
}