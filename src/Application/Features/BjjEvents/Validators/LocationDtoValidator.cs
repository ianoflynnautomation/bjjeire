
using BjjWorld.Application.Common.DTOs;
using BjjWorld.Application.Common.Extensions;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class LocationDtoValidator : AbstractValidator<LocationDto>
{
  public LocationDtoValidator(IValidator<GeoCoordinatesDto> geoCoordinatesDtoValidator)
  {
    RuleFor(x => x.Address)
    .ApplyRequiredString("Event address", 100);

    RuleFor(x => x.Venue)
    .ApplyRequiredString("Event venue", 100);

    RuleFor(x => x.Coordinates)
      .ApplyNotNullValidator("Coordinates")
        .SetValidator(geoCoordinatesDtoValidator);
  }

}