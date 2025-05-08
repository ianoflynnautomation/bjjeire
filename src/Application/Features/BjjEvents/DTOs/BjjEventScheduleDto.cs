using BjjWorld.Domain.Entities.BjjEvents;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Application.Features.BjjEvents.DTOs;

public class BjjEventScheduleDto 
{
    public ScheduleType ScheduleType { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public List<BjjEventHoursDto>? Hours { get; set; }
}

public class BjjEventScheduleMapping : Profile
{
    public BjjEventScheduleMapping()
    {

        CreateMap<BjjEventSchedule, BjjEventScheduleDto>();
        CreateMap<BjjEventScheduleDto, BjjEventSchedule>();
    }

}