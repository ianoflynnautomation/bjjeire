
using BjjWorld.Domain.Entities.BjjEvents;

namespace BjjWorld.Application.Features.BjjEvents.DTOs;

public class BjjEventHoursDto
{
    public DayOfWeek Day { get; set; }
    public TimeSpan OpenTime { get; set; }
    public TimeSpan CloseTime { get; set; }
}

public class BjjEventHoursMapping : Profile
{
    public BjjEventHoursMapping()
    {
        CreateMap<BjjEventHours, BjjEventHoursDto>();
        CreateMap<BjjEventHoursDto, BjjEventHours>();
    }
}