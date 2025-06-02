
using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Common.Extensions;

namespace BjjEire.Application.Common.Validators;

public class GeoCoordinatesDtoValidator : AbstractValidator<GeoCoordinatesDto>
{
  public GeoCoordinatesDtoValidator()
  {

    _ = RuleFor(x => x.Type)
        .ApplyRequiredString("Type", 50);

    _ = RuleFor(x => x.Latitude)
        .ApplyInclusiveBetweenValidator("Latitude", -90.0, 90.0);

    _ = RuleFor(x => x.Longitude)
        .ApplyInclusiveBetweenValidator("Longitude", -180.0, 180.0);

    _ = RuleFor(x => x.PlaceName!)
        .ApplyMaxLengthValidator("Place Name", 100);

    _ = RuleFor(x => x.PlaceId!)
        .ApplyMaxLengthValidator("Place ID", 24);
  }

}
