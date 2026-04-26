// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Features.BjjEvents.DTOs;

public class BjjEventScheduleDto
{
    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public List<BjjEventHoursDto>? Hours { get; set; }
}

public class BjjEventScheduleMapping : Profile
{
    public BjjEventScheduleMapping()
    {
        _ = CreateMap<BjjEventSchedule, BjjEventScheduleDto>();
        _ = CreateMap<BjjEventScheduleDto, BjjEventSchedule>();
    }
}
