using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Application.Features.GymOpenMats.DTOs;

public class GymOpeningHoursDto
{
    public DayOfWeek Day { get; set; }
    public TimeSpan OpenTime { get; set; }
    public TimeSpan CloseTime { get; set; }
}

public class OpeningHoursMapping : Profile
{
    public OpeningHoursMapping()
    {
        CreateMap<GymOpeningHours, GymOpeningHoursDto>();
        CreateMap<GymOpeningHoursDto, GymOpeningHours>();
    }
}