
using BjjWorld.Domain.Entities.BjjEvents;

namespace BjjWorld.Application.Features.BjjEvents.DTOs;

public class OrganizerDto
{
    public string Name { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
}

public class OrganizerMapping : Profile
{
    public OrganizerMapping()
    {

        CreateMap<Organizer, OrganizerDto>();
        CreateMap<OrganizerDto, Organizer>();
    }

}