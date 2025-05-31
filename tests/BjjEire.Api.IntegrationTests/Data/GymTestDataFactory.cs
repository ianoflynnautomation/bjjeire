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
    private static string GenerateSafeUrl(Faker faker, string domainPrefix, string path = "")
    {
        var randomWord = faker.Random.Word().ToLower(CultureInfo.InvariantCulture).Replace(" ", "").Replace("'", "");
        return $"https://www.{domainPrefix.ToLower()}{randomWord}.com{path}";
    }

    private static string GenerateCityBasedUrl(Faker faker, string prefix, string city, string path = "", string extension = ".ie")
    {
        var sanitizedCity = city.ToLower(CultureInfo.InvariantCulture)
            .Replace(" ", "")
            .Replace("'", "")
            .Replace(".", "")
            .Replace(",", "");
        if (string.IsNullOrEmpty(sanitizedCity))
        {
            sanitizedCity = "default"; // Fallback to avoid empty URLs
        }
        return $"https://www.{prefix}{sanitizedCity}{extension}{path}";
    }
    private static Faker<GeoCoordinatesDto> GeoCoordinatesDtoGenerator { get; } = new Faker<GeoCoordinatesDto>()
        .RuleFor(x => x.Type, "Point")
        .RuleFor(x => x.Latitude, faker => Math.Round(faker.Address.Latitude(), 6))
        .RuleFor(x => x.Longitude, faker => Math.Round(faker.Address.Longitude(), 6))
        .RuleFor(x => x.PlaceName, faker => faker.Address.StreetAddress().SetMinMaxLength(5, 100))
        .RuleFor(x => x.PlaceId, faker => $"ChIJ{faker.Random.String2(20, "0123456789abcdefghijklmnopqrstuvwxyz")}".SetMinMaxLength(24, 24));
    private static Faker<LocationDto> LocationDtoGenerator { get; } = new Faker<LocationDto>()
        .RuleFor(x => x.Address, faker => faker.Address.StreetAddress().SetMinMaxLength(5, 100))
        .RuleFor(x => x.Venue, faker => $"{faker.Company.CompanyName()} Training Centre".SetMinMaxLength(5, 100))
        .RuleFor(x => x.Coordinates, faker => GeoCoordinatesDtoGenerator.Generate());
    private static Faker<SocialMediaDto> SocialMediaDtoGenerator { get; } = new Faker<SocialMediaDto>()
        .RuleFor(x => x.Instagram, faker => faker.Random.Bool(0.7f) ? $"https://www.instagram.com/{faker.Random.Word().ToLower().Replace(" ", "").Replace("'", "")}" : string.Empty)
        .RuleFor(x => x.Facebook, faker => faker.Random.Bool(0.7f) ? $"https://www.facebook.com/{faker.Random.Word().ToLower().Replace(" ", "").Replace("'", "")}" : string.Empty)
        .RuleFor(x => x.X, faker => faker.Random.Bool(0.3f) ? $"https://www.x.com/{faker.Random.Word().ToLower().Replace(" ", "").Replace("'", "")}" : string.Empty)
        .RuleFor(x => x.YouTube, faker => faker.Random.Bool(0.3f) ? $"https://www.youtube.com/@{faker.Random.Word().ToLower().Replace(" ", "").Replace("'", "")}" : string.Empty);
    private static Faker<TrialOfferDto> TrialOfferDtoGenerator { get; } = new Faker<TrialOfferDto>()
        .RuleFor(x => x.IsAvailable, faker => faker.Random.Bool(0.9f))
        .RuleFor(x => x.FreeClasses, (faker, u) => u.IsAvailable ? faker.Random.Int(1, 10) : null)
        .RuleFor(x => x.FreeDays, (faker, u) => u.IsAvailable && !u.FreeClasses.HasValue ? faker.Random.Int(1, 30) : null)
        .RuleFor(x => x.Notes, (faker, u) => u.IsAvailable ? faker.Lorem.Sentence(5, 10).SetMinMaxLength(10, 500) : string.Empty);
    private static Faker<AffiliationDto> AffiliationDtoGenerator { get; } = new Faker<AffiliationDto>()
        .RuleFor(x => x.Name, faker => $"{faker.Company.CompanyName()} Affiliation".SetMinMaxLength(5, 100))
        .RuleFor(x => x.Website, faker => GenerateSafeUrl(faker, "affiliation", "/home"));
    private static Faker<GymDto> GymDtoGenerator { get; } = new Faker<GymDto>()
        .RuleFor(x => x.Id, faker => faker.Random.Hexadecimal(24, "").ToLower())
        .RuleFor(x => x.Name, faker => $"Team {faker.Company.CatchPhrase()} BJJ".SetMinMaxLength(5, 100))
        .RuleFor(x => x.Description, faker => faker.Lorem.Sentence(10).SetMinMaxLength(10, 200))
        .RuleFor(x => x.Status, faker => faker.PickRandom<GymStatus>())
        .RuleFor(x => x.County, faker => faker.Address.County().SetMinMaxLength(5, 100))
        .RuleFor(x => x.Affiliation, faker => AffiliationDtoGenerator.Generate())
        .RuleFor(x => x.TrialOffer, faker => TrialOfferDtoGenerator.Generate())
        .RuleFor(x => x.Location, faker => LocationDtoGenerator.Generate())
        .RuleFor(x => x.SocialMedia, faker => SocialMediaDtoGenerator.Generate())
        .RuleFor(x => x.Website, (f, u) => GenerateCityBasedUrl(f, "gym", f.Address.City(), "/home"))
        .RuleFor(x => x.TimetableUrl, (f, u) => GenerateCityBasedUrl(f, "gym", f.Address.City(), "/schedule"))
        .RuleFor(x => x.ImageUrl, (f, u) => GenerateCityBasedUrl(f, "gym", f.Address.City(), "/images/main.jpg"))
        .RuleFor(x => x.OfferedClasses, faker =>
        {
            var availableClasses = Enum.GetValues<ClassCategory>().ToList();
            return faker.PickRandom(availableClasses, faker.Random.Int(1, Math.Min(3, availableClasses.Count)))
                .Distinct()
                .ToList();
        });

    public static Faker<CreateGymCommand> CreateGymCommandGenerator { get; } = new Faker<CreateGymCommand>()
        .RuleFor(x => x.Data, (faker, cmd) => GymDtoGenerator.Generate());

    private static string SetMinMaxLength(this string str, int min, int max)
    {
        if (string.IsNullOrEmpty(str))
        {
            str = new Faker().Lorem.Word().ToLower(CultureInfo.InvariantCulture);
        }

        if (str.Length > max)
        {
            str = str.Substring(0, max);
        }

        if (str.Length < min)
        {
            str = str.PadRight(min, 'a');
        }

        return str;
    }
}
