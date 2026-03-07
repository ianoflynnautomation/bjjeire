
using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Features.BjjEvents.DTOs;

public class OrganizerDto
{
    public string Name { get; set; } = string.Empty;

    public string Website { get; set; } = string.Empty;
}

public class OrganizerMapping : Profile
{
    public OrganizerMapping()
    {

        _ = CreateMap<Organizer, OrganizerDto>();
        _ = CreateMap<OrganizerDto, Organizer>();
    }

}
