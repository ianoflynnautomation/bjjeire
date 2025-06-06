

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Application.Features.Gyms.Validators;
using BjjEire.Domain.Enums;
using Bogus;
using DnsClient.Protocol;
using FluentValidation;
using FluentValidation.TestHelper;
using Moq;
using Xunit;

namespace BjjEire.Application.UnitTests.Features.Gyms.Validators;

public class GymDtoValidatorTests
{
    private readonly Mock<IValidator<SocialMediaDto>> _socialMediaValidatorMock;
    private readonly Mock<IValidator<LocationDto>> _locationValidatorMock;
    private readonly Mock<IValidator<AffiliationDto?>> _affiliationValidatorMock;
    private readonly Mock<IValidator<TrialOfferDto>> _trialOfferValidatorMock;

    private readonly GymDtoValidator _validator;

    public GymDtoValidatorTests()
    {
        _socialMediaValidatorMock = new Mock<IValidator<SocialMediaDto>>();
        _locationValidatorMock = new Mock<IValidator<LocationDto>>();
        _affiliationValidatorMock = new Mock<IValidator<AffiliationDto?>>();
        _trialOfferValidatorMock = new Mock<IValidator<TrialOfferDto>>();

        _validator = new GymDtoValidator(
            _socialMediaValidatorMock.Object,
            _locationValidatorMock.Object,
            _affiliationValidatorMock.Object,
            _trialOfferValidatorMock.Object
        );
    }

    private static GymDto GetValidGymDto()
    {
        var faker = new Faker();
        return new GymDto
        {
            Id = faker.Random.Hexadecimal(24, "").ToLower(),
            Name = "Valid Gym Name",
            Description = "Valid gym description, not too long.",
            Status = GymStatus.Active,
            County = County.Dublin,
            Affiliation = new AffiliationDto
            {
                Name = "Valid Affiliation Name",
                Website = "https://www.validaffiliation.com"
            },
            TrialOffer = new TrialOfferDto
            {
                IsAvailable = true,
                FreeClasses = 3,
                FreeDays = null,
                Notes = "Valid trial notes, well within length limits."
            },
            Location = new LocationDto
            {
                Address = "123 Valid Street, Valid Town",
                Venue = "Valid Venue Hall",
                Coordinates = new GeoCoordinatesDto
                {
                    Type = "Point",
                    Latitude = 53.349805,
                    Longitude = -6.260273,
                    PlaceName = "Central Dublin Point",
                    PlaceId = $"ChIJ{faker.Random.String2(20, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_")}"
                }
            },
            SocialMedia = new SocialMediaDto
            {
                Instagram = "https://www.instagram.com/validgymprofile",
                Facebook = "https://www.facebook.com/validgympage",
                X = "https://www.x.com/validgymhandle",
                YouTube = "https://www.youtube.com/c/validgymchannel"
            },
            Website = "https://www.validgymsite.com",
            TimetableUrl = "https://www.validgymsite.com/schedule",
            ImageUrl = "https://www.validgymsite.com/images/main_logo.png",
            OfferedClasses = [ClassCategory.BJJGiAllLevels, ClassCategory.BJJGiFundamentals]
        };
    }

    [Fact]
    public void GivenAllPropertiesAreValid_ShouldNotHaveAnyValidationErrors()
    {
        // Arrange
        var model = GetValidGymDto();

        // Act
        var result = _validator.TestValidate(model);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void GivenNameIsTooLong_ShouldHaveValidationErrorForName()
    {
        // Arrange
        var model = GetValidGymDto();
        model.Name = new string('a', 101);

        // Act
        var result = _validator.TestValidate(model);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name)
            .WithErrorCode("")
            .WithErrorMessage("'Location' cannot be null.");
    }

    [Fact]
    public void GivenLocationIsNull_ShouldHaveValidationErrorForLocation()
    {
        // Arrange
        var model = GetValidGymDto();
        model.Location = null!;

        // Act
        var result = _validator.TestValidate(model);

        // Assert
        _ = result.ShouldHaveValidationErrorFor(x => x.Location)
            .WithErrorCode("")
            .WithErrorMessage("'Location' cannot be null.");
    }


    [Fact]
    public void GivenWebsiteIsInvalid_ShouldHaveValidationErrorForWebsite()
    {
        // Arrange
        var model = GetValidGymDto();
        model.Website = "this is not a valid url";

        // Act
        var result = _validator.TestValidate(model);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Website);
    }

    [Fact]
    public void GivenWebsiteIsEmpty_ShouldNotHaveValidationErrorForWebsite()
    {
        // Arrange
        var model = GetValidGymDto();
        model.Website = ""; // Empty string should be allowed due to the `.When()` clause

        // Act
        var result = _validator.TestValidate(model);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Website);
    }


}
