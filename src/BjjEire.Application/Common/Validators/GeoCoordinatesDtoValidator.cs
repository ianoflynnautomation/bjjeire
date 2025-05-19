
using BjjEire.Application.Common.Extensions;
using BjjEire.Application.Common.DTOs;

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

        _ = RuleFor(x => x.PlaceName)
          .MaximumLength(255)
            .WithName("Place Name")
            .WithMessage(ValidationMessages.MaxLength.Message("Place Name", 255))
            .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);

        _ = RuleFor(x => x.PlaceId)
            .MaximumLength(255)
            .WithName("Place ID")
            .WithMessage(ValidationMessages.MaxLength.Message("Place ID", 255))
            .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);
    }

}