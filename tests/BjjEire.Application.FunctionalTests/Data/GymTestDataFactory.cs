using System.Globalization;
using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Features.Gyms.Commands;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Application.Features.Gyms.Queries;
using BjjEire.Domain.Enums;
using Bogus;

namespace BjjEire.Application.FunctionalTests.Data;

public static class GymTestDataFactory {
    public static GetGymPaginationQuery GetValidGymPaginationQuery() => new() { County = County.Cork, Page = 1, PageSize = 20 };

    public static CreateGymCommand GetValidCreateGymCommand() => new() { Data = GetValidGymDto() };

    public static GymDto GetValidGymDto() {
        var faker = new Faker();
        return new GymDto {
            Id = faker.Random.Hexadecimal(24, "").ToLower(),
            Name = "Valid Gym Name",
            Description = "Valid gym description, not too long.",
            Status = GymStatus.Active,
            County = County.Dublin,
            Affiliation = new AffiliationDto {
                Name = "Valid Affiliation Name",
                Website = "https://www.validaffiliation.com"
            },
            TrialOffer = new TrialOfferDto {
                IsAvailable = true,
                FreeClasses = 3,
                FreeDays = null,
                Notes = "Valid trial notes, well within length limits."
            },
            Location = new LocationDto {
                Address = "123 Valid Street, Valid Town",
                Venue = "Valid Venue Hall",
                Coordinates = new GeoCoordinatesDto {
                    Type = "Point",
                    Latitude = 53.349805,
                    Longitude = -6.260273,
                    PlaceName = "Central Dublin Point",
                    PlaceId = $"ChIJ{faker.Random.String2(20, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_")}"
                }
            },
            SocialMedia = new SocialMediaDto {
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
}
