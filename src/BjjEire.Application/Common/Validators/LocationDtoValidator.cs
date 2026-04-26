// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Extensions;

namespace BjjEire.Application.Common.Validators;

public class LocationDtoValidator : AbstractValidator<LocationDto>
{
    public LocationDtoValidator(IValidator<GeoCoordinatesDto> geoCoordinatesDtoValidator)
    {
        _ = RuleFor(x => x.Address)
            .ApplyRequiredString("Address", 100);

        _ = RuleFor(x => x.Venue)
            .ApplyRequiredString("Venue", 100);

        _ = RuleFor(x => x.Coordinates)
            .ApplyNotNullValidator("Coordinates")
            .SetValidator(geoCoordinatesDtoValidator);
    }

}
