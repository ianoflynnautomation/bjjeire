// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


using BjjEire.Domain.Entities.Gyms;

namespace BjjEire.Application.Features.Gyms.DTOs;

public class AffiliationDto
{
    public string Name { get; set; } = string.Empty;
    public string? Website { get; set; }
}

public class AffiliationDtoMapping : Profile
{
    public AffiliationDtoMapping()
    {
        _ = CreateMap<Affiliation, AffiliationDto>();
        _ = CreateMap<AffiliationDto, Affiliation>();
    }
}
