
using BjjWorld.Application.Common.Extensions;
using BjjWorld.Application.Common.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Validators;

public class GeoCoordinatesDtoValidator  : AbstractValidator<GeoCoordinatesDto>
{
        public GeoCoordinatesDtoValidator()
    {

          RuleFor(dto => dto.Type)
          .ApplyRequiredString("Type", 50);

        RuleFor(dto => dto.Latitude)
            .ApplyInclusiveBetweenValidator("Latitude", -90.0, 90.0);

        RuleFor(dto => dto.Longitude)
            .ApplyInclusiveBetweenValidator("Longitude", -180.0, 180.0);

        RuleFor(dto => dto.PlaceName)
          .MaximumLength(255)
            .WithName("Place Name")
            .WithMessage(ValidationMessages.MaxLength.Message("Place Name", 255))
            .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);

        RuleFor(dto => dto.PlaceId)
            .MaximumLength(255)
            .WithName("Place ID")
            .WithMessage(ValidationMessages.MaxLength.Message("Place ID", 255))
            .WithErrorCode(ValidationMessages.MaxLength.ErrorCode);
    }

}