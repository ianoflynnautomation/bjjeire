
using BjjWorld.Application.Common.DTOs;
using BjjWorld.Application.Common.Extensions;

namespace BjjWorld.Application.Common.Validators;

public class LocationDtoValidator : AbstractValidator<LocationDto> {
  public LocationDtoValidator(IValidator<GeoCoordinatesDto> geoCoordinatesDtoValidator) {
    _ = RuleFor(x => x.Address)
    .ApplyRequiredString("Event address", 100);

    _ = RuleFor(x => x.Venue)
    .ApplyRequiredString("Event venue", 100);

    _ = RuleFor(x => x.Coordinates)
      .ApplyNotNullValidator("Coordinates")
        .SetValidator(geoCoordinatesDtoValidator);
  }

}