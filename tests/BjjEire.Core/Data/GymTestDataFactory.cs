// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Features.Gyms.Commands;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Application.Features.Gyms.Queries;
using BjjEire.Domain.Entities.Common;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Enums;

using Bogus;

using MongoDB.Bson;

namespace BjjEire.Core.Data;

public static class GymTestDataFactory
{
    private static readonly string PlaceIdChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

    private static Faker<GeoCoordinatesDto> GeoCoordinatesDtoGenerator { get; } = new Faker<GeoCoordinatesDto>()
        .RuleFor(x => x.Type, _ => "Point")
        .RuleFor(x => x.Latitude, f => Math.Round(f.Address.Latitude(), 6))
        .RuleFor(x => x.Longitude, f => Math.Round(f.Address.Longitude(), 6))
        .RuleFor(x => x.PlaceName, f => f.Address.StreetAddress().SetMinMaxLength(5, 100))
        .RuleFor(x => x.PlaceId, f => $"ChIJ{f.Random.String2(20, PlaceIdChars)}");

    private static Faker<LocationDto> LocationDtoGenerator { get; } = new Faker<LocationDto>()
        .RuleFor(x => x.Address, f => f.Address.StreetAddress().SetMinMaxLength(5, 100))
        .RuleFor(x => x.Venue, f => $"{f.Company.CompanyName()} Training Centre".SetMinMaxLength(5, 100))
        .RuleFor(x => x.Coordinates, _ => GeoCoordinatesDtoGenerator.Generate());

    private static Faker<SocialMediaDto> SocialMediaDtoGenerator { get; } = new Faker<SocialMediaDto>()
        .RuleFor(x => x.Instagram, f => f.Random.Bool(0.7f) ? $"https://www.instagram.com/{f.Internet.UserName().ToLowerInvariant()}" : string.Empty)
        .RuleFor(x => x.Facebook, f => f.Random.Bool(0.7f) ? $"https://www.facebook.com/{f.Internet.UserName().ToLowerInvariant()}" : string.Empty)
        .RuleFor(x => x.X, f => f.Random.Bool(0.3f) ? $"https://www.x.com/{f.Internet.UserName().ToLowerInvariant()}" : string.Empty)
        .RuleFor(x => x.YouTube, f => f.Random.Bool(0.3f) ? $"https://www.youtube.com/c/{f.Internet.UserName().ToLowerInvariant()}" : string.Empty);

    private static Faker<TrialOfferDto> TrialOfferDtoGenerator { get; } = new Faker<TrialOfferDto>()
        .RuleFor(x => x.IsAvailable, f => f.Random.Bool(0.9f))
        .RuleFor(x => x.FreeClasses, (f, u) => u.IsAvailable ? f.Random.Int(1, 10) : (int?)null)
        .RuleFor(x => x.FreeDays, (f, u) => u.IsAvailable && !u.FreeClasses.HasValue ? f.Random.Int(1, 30) : (int?)null)
        .RuleFor(x => x.Notes, (f, u) => u.IsAvailable ? f.Lorem.Sentence(5, 10).SetMinMaxLength(10, 500) : string.Empty);

    private static Faker<AffiliationDto> AffiliationDtoGenerator { get; } = new Faker<AffiliationDto>()
        .RuleFor(x => x.Name, f => $"{f.Company.CompanyName()} Affiliation".SetMinMaxLength(5, 100))
        .RuleFor(x => x.Website, f => $"https://www.{f.Internet.DomainWord()}affiliation.com");

    private static Faker<GymDto> GymDtoGenerator { get; } = new Faker<GymDto>()
        .RuleFor(x => x.Id, _ => ObjectId.GenerateNewId().ToString())
        .RuleFor(x => x.Name, f => $"Team {f.Company.CatchPhrase()} BJJ".SetMinMaxLength(5, 100))
        .RuleFor(x => x.Description, f => f.Lorem.Sentence(10).SetMinMaxLength(10, 200))
        .RuleFor(x => x.Status, f => f.PickRandom<GymStatus>())
        .RuleFor(x => x.County, f => f.PickRandom<County>())
        .RuleFor(x => x.Affiliation, _ => AffiliationDtoGenerator.Generate())
        .RuleFor(x => x.TrialOffer, _ => TrialOfferDtoGenerator.Generate())
        .RuleFor(x => x.Location, _ => LocationDtoGenerator.Generate())
        .RuleFor(x => x.SocialMedia, _ => SocialMediaDtoGenerator.Generate())
        .RuleFor(x => x.Website, f => $"https://www.{f.Internet.DomainWord()}gym.ie")
        .RuleFor(x => x.TimetableUrl, (_, u) => $"{u.Website}/schedule")
        .RuleFor(x => x.ImageUrl, (_, u) => $"{u.Website}/images/main.jpg")
        .RuleFor(x => x.OfferedClasses, f =>
        {
            List<ClassCategory> availableClasses = Enum.GetValues<ClassCategory>().ToList();
            return f.PickRandom(availableClasses, f.Random.Int(1, Math.Min(3, availableClasses.Count)))
                    .Distinct()
                    .ToList();
        });

    private static Faker<Gym> GymEntityGenerator { get; } = new Faker<Gym>()
        .RuleFor(x => x.Id, _ => ObjectId.GenerateNewId().ToString())
        .RuleFor(x => x.Name, f => $"Team {f.Company.CatchPhrase()} BJJ".SetMinMaxLength(5, 100))
        .RuleFor(x => x.Description, f => f.Lorem.Sentence(10).SetMinMaxLength(10, 200))
        .RuleFor(x => x.Status, _ => GymStatus.Active)
        .RuleFor(x => x.County, f => f.PickRandom<County>())
        .RuleFor(x => x.Affiliation, f => new Affiliation
        {
            Name = $"{f.Company.CompanyName()} Affiliation".SetMinMaxLength(5, 100),
            Website = $"https://www.{f.Internet.DomainWord()}affiliation.com"
        })
        .RuleFor(x => x.TrialOffer, f =>
        {
            bool available = f.Random.Bool(0.9f);
            return new TrialOffer
            {
                IsAvailable = available,
                FreeClasses = available ? f.Random.Int(1, 10) : null,
                FreeDays = null,
                Notes = available ? f.Lorem.Sentence(5, 10).SetMinMaxLength(10, 500) : string.Empty
            };
        })
        .RuleFor(x => x.Location, f => new Location
        {
            Address = f.Address.StreetAddress().SetMinMaxLength(5, 100),
            Venue = $"{f.Company.CompanyName()} Training Centre".SetMinMaxLength(5, 100),
            Coordinates = new GeoCoordinates
            {
                Coordinates = [Math.Round(f.Address.Longitude(), 6), Math.Round(f.Address.Latitude(), 6)],
                PlaceId = $"ChIJ{f.Random.String2(20, PlaceIdChars)}"
            }
        })
        .RuleFor(x => x.SocialMedia, f => new SocialMedia
        {
            Instagram = f.Random.Bool(0.7f) ? $"https://www.instagram.com/{f.Internet.UserName().ToLowerInvariant()}" : string.Empty,
            Facebook = f.Random.Bool(0.7f) ? $"https://www.facebook.com/{f.Internet.UserName().ToLowerInvariant()}" : string.Empty,
        })
        .RuleFor(x => x.Website, f => $"https://www.{f.Internet.DomainWord()}gym.ie")
        .RuleFor(x => x.TimetableUrl, (_, g) => $"{g.Website}/schedule")
        .RuleFor(x => x.ImageUrl, (_, g) => $"{g.Website}/images/main.jpg")
        .RuleFor(x => x.OfferedClasses, f =>
        {
            List<ClassCategory> availableClasses = Enum.GetValues<ClassCategory>().ToList();
            return f.PickRandom(availableClasses, f.Random.Int(1, Math.Min(3, availableClasses.Count)))
                    .Distinct()
                    .ToList();
        });

    public static Faker<CreateGymCommand> BogusCreateGymCommandGenerator { get; } = new Faker<CreateGymCommand>()
        .RuleFor(x => x.Data, _ => GymDtoGenerator.Generate());

    public static GetGymPaginationQuery GetValidGymPaginationQuery() => new() { County = County.Cork, Page = 1, PageSize = 20 };

    public static CreateGymCommand GetValidCreateGymCommand() => new() { Data = GetValidGymDto() };

    public static GymDto GetValidGymDto() => new()
    {
        Id = ObjectId.GenerateNewId().ToString(),
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
                Coordinates = [-6.260273, 53.349805],
                PlaceName = "Central Dublin Point",
                PlaceId = "ChIJrTLr-GyuEmsRBfy61i59"
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

    public static Gym CreateGym(Action<Gym>? configure = null)
    {
        Gym gym = GymEntityGenerator.Generate();
        configure?.Invoke(gym);
        return gym;
    }

    private static string SetMinMaxLength(this string? str, int min, int max)
    {
        string value = string.IsNullOrEmpty(str) ? "default" : str;
        if (value.Length > max)
            value = value[..max];
        if (value.Length < min)
            value = value.PadRight(min, 'a');
        return value;
    }
}
