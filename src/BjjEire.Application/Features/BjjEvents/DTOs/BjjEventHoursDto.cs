// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Application.Features.BjjEvents.DTOs;

public class BjjEventHoursDto
{
    public DayOfWeek Day { get; init; }

    public TimeSpan OpenTime { get; set; }

    public TimeSpan CloseTime { get; set; }
}

public class BjjEventHoursMapping : Profile
{
    public BjjEventHoursMapping()
    {
        _ = CreateMap<BjjEventHours, BjjEventHoursDto>();
        _ = CreateMap<BjjEventHoursDto, BjjEventHours>();
    }
}
