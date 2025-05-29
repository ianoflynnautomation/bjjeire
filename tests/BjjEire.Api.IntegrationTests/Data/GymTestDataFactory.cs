// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using System.Globalization;
using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Features.Gyms.Commands;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Domain.Enums;
using Bogus;

namespace BjjEire.Api.IntegrationTests.Data;

public static class GymTestDataFactory
{
    private static string GenerateSafeUrl(Faker faker, string domainPrefix)
    {
        // Generates a plausible and valid URL structure
        return $"https://www.{domainPrefix.ToLower().Replace(" ", "")}{faker.Random.Word().ToLower()}.{faker.Internet.DomainSuffix()}";
    }

    private static string GenerateCityBasedUrl(Faker faker, string prefix, string city, string path = "", string extension = ".com")
    {
        var sanitizedCity = city.ToLower(CultureInfo.InvariantCulture).Replace(" ", "").Replace("'", "");
        return $"https://www.{prefix}{sanitizedCity}{extension}{path}";
    }

    private static Faker<GeoCoordinatesDto> GeoCoordinatesDtoGenerator { get; } = new Faker<GeoCoordinatesDto>()
        .RuleFor(x => x.Type, "Point") // As per common usage and likely validation
        .RuleFor(x => x.Latitude, faker => faker.Address.Latitude(-90.0, 90.0))
        .RuleFor(x => x.Longitude, faker => faker.Address.Longitude(-180.0, 180.0))
        .RuleFor(x => x.PlaceName, faker => faker.Address.StreetAddress().ClampLength(1, 255))
        .RuleFor(x => x.PlaceId, faker => $"ChIJ{faker.Random.String2(20, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")}".ClampLength(1,255)); // ClampLength is a hypothetical extension

    private static Faker<LocationDto> LocationDtoGenerator { get; } = new Faker<LocationDto>()
        .RuleFor(x => x.Address, faker => faker.Address.StreetAddress().ClampLength(1, 100))
        .RuleFor(x => x.Venue, faker => $"{faker.Company.CompanyName()} Training Centre".ClampLength(1, 100))
        .RuleFor(x => x.Coordinates, faker => GeoCoordinatesDtoGenerator.Generate());

    private static Faker<SocialMediaDto> SocialMediaDtoGenerator { get; } = new Faker<SocialMediaDto>()
        .RuleFor(x => x.Instagram, faker => faker.Random.Bool(0.7f) ? GenerateSafeUrl(faker, "instagram") : string.Empty)
        .RuleFor(x => x.Facebook, faker => faker.Random.Bool(0.7f) ? GenerateSafeUrl(faker, "facebook") : string.Empty)
        .RuleFor(x => x.X, faker => faker.Random.Bool(0.3f) ? GenerateSafeUrl(faker, "x") : string.Empty)
        .RuleFor(x => x.YouTube, faker => faker.Random.Bool(0.3f) ? GenerateSafeUrl(faker, "youtube") : string.Empty);

    private static Faker<TrialOfferDto> TrialOfferDtoGenerator { get; } = new Faker<TrialOfferDto>()
        .RuleFor(x => x.IsAvailable, true)
        .RuleFor(x => x.FreeClasses, faker => faker.Random.Int(1, 10))
        .RuleFor(x => x.FreeDays, (faker, u) => u.FreeClasses.HasValue && faker.Random.Bool(0.3f) ? null : (int?)faker.Random.Int(1, 30))
        .RuleFor(x => x.Notes, faker => faker.Lorem.Sentence(10).ClampLength(max: 500));

    private static Faker<AffiliationDto> AffiliationDtoGenerator { get; } = new Faker<AffiliationDto>()
        .RuleFor(x => x.Name, faker => $"{faker.Company.CompanyName()} Affiliation".ClampLength(1, 100))
        .RuleFor(x => x.Website, faker => GenerateSafeUrl(faker, "affiliation"));

    private static Faker<GymDto> GymDtoGenerator { get; } = new Faker<GymDto>()
        .RuleFor(x => x.Id, faker => faker.Random.Hexadecimal(24, ""))
        .RuleFor(x => x.CreatedOnUtc, faker => faker.Date.Past(1, DateTime.UtcNow).ToUniversalTime())
        .RuleFor(x => x.UpdatedOnUtc,
            faker => faker.Random.Bool(0.8f) ? faker.Date.Recent(10).ToUniversalTime() : (DateTime?)null)

        // Validated Fields
        .RuleFor(x => x.Name, faker => $"Team {faker.Company.CatchPhrase()} BJJ".ClampLength(1, 100))
        .RuleFor(x => x.Description, faker => faker.Lorem.Paragraphs(1).ClampLength(max: 100))
        .RuleFor(x => x.Status, faker => faker.PickRandom<GymStatus>())
        .RuleFor(x => x.County, faker => faker.Address.County().ClampLength(1, 100))
        .RuleFor(x => x.Affiliation, faker => AffiliationDtoGenerator.Generate())
        .RuleFor(x => x.TrialOffer, faker => TrialOfferDtoGenerator.Generate())
        .RuleFor(x => x.Location, faker => LocationDtoGenerator.Generate())
        .RuleFor(x => x.SocialMedia, faker => SocialMediaDtoGenerator.Generate())
        .RuleFor(x => x.Website,
            (f, u) => GenerateCityBasedUrl(f, "gym", f.Address.City(), path: "/home", extension: ".ie"))
        .RuleFor(x => x.TimetableUrl,
            (f, u) => GenerateCityBasedUrl(f, "gym", f.Address.City(), path: "/schedule", extension: ".ie"))
        .RuleFor(x => x.ImageUrl,
            (f, u) => GenerateCityBasedUrl(f, "gym", f.Address.City(), path: "/images/main.jpg", extension: ".ie"))
        .RuleFor(x => x.OfferedClasses, faker =>
            faker.PickRandom(Enum.GetValues(typeof(ClassCategory)).Cast<ClassCategory>(),
                    faker.Random.Int(1, Math.Min(3, Enum.GetValues(typeof(ClassCategory)).Length)))
                .Distinct()
                .ToList());

    public static Faker<CreateGymCommand> CreateGymCommandGenerator { get; } = new Faker<CreateGymCommand>()
        .RuleFor(x => x.Model, (faker, cmd) => GymDtoGenerator.Generate());

    // Helper extension method (consider putting this in a shared utility class)
    private static string ClampLength(this string str, int? min = null, int? max = null)
    {
        if (max.HasValue && str.Length > max.Value)
        {
            str = str.Substring(0, max.Value);
        }
        if (min.HasValue && str.Length < min.Value)
        {
            str = str.PadRight(min.Value, 'X'); // Or throw, or generate more meaningful content
        }
        return str;
    }
}
