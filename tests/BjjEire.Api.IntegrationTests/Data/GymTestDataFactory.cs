using System.Globalization;
using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Features.Gyms.Commands;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Domain.Enums;
using Bogus;

namespace BjjEire.Api.IntegrationTests.Data;

public static class GymTestDataFactory
{
  private static string SanitizeForUrlComponent(string? input, string fallback = "random")
  {
    if (string.IsNullOrWhiteSpace(input))
    {
      return fallback;
    }
    var sanitized = input.ToLower(CultureInfo.InvariantCulture)
        .Replace(" ", "")
        .Replace("'", "")
        .Replace(".", "")
        .Replace(",", "");
    return string.IsNullOrWhiteSpace(sanitized) ? fallback : sanitized;
  }

  private static string GenerateSafeUrl(Faker faker, string domainPrefix, string path = "")
  {
    var randomWord = SanitizeForUrlComponent(faker.Lorem.Word(), "defaultword");
    var sanitizedDomainPrefix = SanitizeForUrlComponent(domainPrefix, "defaultprefix");
    return $"https://www.{sanitizedDomainPrefix}{randomWord}.com{path}";
  }

  private static string GenerateCityBasedUrl(Faker faker, string prefix, string? city, string path = "", string extension = ".ie")
  {
    var sanitizedCity = SanitizeForUrlComponent(city, "defaultcity");
    var sanitizedPrefix = SanitizeForUrlComponent(prefix, "defaultprefix");
    return $"https://www.{sanitizedPrefix}{sanitizedCity}{extension}{path}";
  }

  private static Faker<GeoCoordinatesDto> GeoCoordinatesDtoGenerator { get; } = new Faker<GeoCoordinatesDto>()
      .RuleFor(x => x.Type, "Point")
      .RuleFor(x => x.Latitude, faker => Math.Round(faker.Address.Latitude(), 6))
      .RuleFor(x => x.Longitude, faker => Math.Round(faker.Address.Longitude(), 6))
      .RuleFor(x => x.PlaceName, faker => faker.Address.StreetAddress().SetMinMaxLength(5, 100))
      .RuleFor(x => x.PlaceId, faker => $"ChIJ{faker.Random.String2(20, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_")}".SetMinMaxLength(24, 24)); // Added more URL-safe chars for PlaceId

  private static Faker<LocationDto> LocationDtoGenerator { get; } = new Faker<LocationDto>()
      .RuleFor(x => x.Address, faker => faker.Address.StreetAddress().SetMinMaxLength(5, 100))
      .RuleFor(x => x.Venue, faker => $"{faker.Company.CompanyName()} Training Centre".SetMinMaxLength(5, 100))
      .RuleFor(x => x.Coordinates, faker => GeoCoordinatesDtoGenerator.Generate());

  private static Faker<SocialMediaDto> SocialMediaDtoGenerator { get; } = new Faker<SocialMediaDto>()
      .RuleFor(x => x.Instagram, faker => faker.Random.Bool(0.7f) ? $"https://www.instagram.com/{SanitizeForUrlComponent(faker.Internet.UserName())}" : string.Empty)
      .RuleFor(x => x.Facebook, faker => faker.Random.Bool(0.7f) ? $"https://www.facebook.com/{SanitizeForUrlComponent(faker.Internet.UserName())}" : string.Empty)
      .RuleFor(x => x.X, faker => faker.Random.Bool(0.3f) ? $"https://www.x.com/{SanitizeForUrlComponent(faker.Internet.UserName())}" : string.Empty)
      .RuleFor(x => x.YouTube, faker => faker.Random.Bool(0.3f) ? $"https://www.youtube.com/c/{SanitizeForUrlComponent(faker.Internet.UserName())}" : string.Empty);

  private static Faker<TrialOfferDto> TrialOfferDtoGenerator { get; } = new Faker<TrialOfferDto>()
      .RuleFor(x => x.IsAvailable, faker => faker.Random.Bool(0.9f))
      .RuleFor(x => x.FreeClasses, (faker, u) => u.IsAvailable ? faker.Random.Int(1, 10) : (int?)null)
      .RuleFor(x => x.FreeDays, (faker, u) => u.IsAvailable && !u.FreeClasses.HasValue ? faker.Random.Int(1, 30) : (int?)null)
      .RuleFor(x => x.Notes, (faker, u) => u.IsAvailable ? faker.Lorem.Sentence(5, 10).SetMinMaxLength(10, 500) : string.Empty);

  private static Faker<AffiliationDto> AffiliationDtoGenerator { get; } = new Faker<AffiliationDto>()
      .RuleFor(x => x.Name, faker => $"{faker.Company.CompanyName()} Affiliation".SetMinMaxLength(5, 100))
      .RuleFor(x => x.Website, faker => GenerateSafeUrl(faker, "affiliation", "/home"));

  private static Faker<GymDto> GymDtoGenerator { get; } = new Faker<GymDto>()
      .RuleFor(x => x.Id, faker => faker.Random.Hexadecimal(24, "").ToLower())
      .RuleFor(x => x.Name, faker => $"Team {faker.Company.CatchPhrase()} BJJ".SetMinMaxLength(5, 100))
      .RuleFor(x => x.Description, faker => faker.Lorem.Sentence(10).SetMinMaxLength(10, 200))
      .RuleFor(x => x.Status, faker => faker.PickRandom<GymStatus>())
      .RuleFor(x => x.County, faker => faker.PickRandom<County>())
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

  public static Faker<CreateGymCommand> BogusCreateGymCommandGenerator { get; } = new Faker<CreateGymCommand>()
      .RuleFor(x => x.Data, (faker, cmd) => GymDtoGenerator.Generate());

  public static CreateGymCommand GetValidCreateGymCommand() => new() { Data = GetValidGymDto() };

  public static GymDto GetValidGymDto()
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

  private static string SetMinMaxLength(this string? str, int min, int max)
  {
    var tempStr = str;
    if (string.IsNullOrEmpty(tempStr))
    {
      tempStr = new Faker().Lorem.Word().ToLower(CultureInfo.InvariantCulture);
      if (string.IsNullOrEmpty(tempStr))
      {
        tempStr = "default";
      }
    }

    if (tempStr.Length > max)
    {
      tempStr = tempStr.Substring(0, max);
    }

    if (tempStr.Length < min)
    {
      tempStr = tempStr.PadRight(min, 'a');
    }
    return tempStr;
  }
}
