// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Entities.Common;
using BjjEire.Domain.Enums;

using Bogus;

using MongoDB.Bson;

namespace BjjEire.Core.Data;

public static class BjjEventTestDataFactory
{
    private static readonly string PlaceIdChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

    private static Faker<BjjEventDto> BjjEventDtoGenerator { get; } = new Faker<BjjEventDto>()
        .RuleFor(x => x.Id, _ => ObjectId.GenerateNewId().ToString())
        .RuleFor(x => x.Name, f => $"{f.Address.City()} BJJ {f.PickRandom("Seminar", "Open Mat", "Tournament")}")
        .RuleFor(x => x.Description, f => f.Lorem.Sentence(10, 5))
        .RuleFor(x => x.Type, f => f.PickRandom<BjjEventType>())
        .RuleFor(x => x.Organiser, f => new OrganizerDto
        {
            Name = $"{f.Address.City()} Grappling Academy",
            Website = $"https://www.{f.Internet.DomainWord()}.ie"
        })
        .RuleFor(x => x.Status, _ => EventStatus.Upcoming)
        .RuleFor(x => x.SocialMedia, f => new SocialMediaDto
        {
            Instagram = $"https://www.instagram.com/{f.Internet.UserName().ToLowerInvariant()}",
            Facebook = $"https://www.facebook.com/{f.Internet.UserName().ToLowerInvariant()}",
        })
        .RuleFor(x => x.County, f => f.PickRandom<County>())
        .RuleFor(x => x.Location, f => new LocationDto
        {
            Address = f.Address.StreetAddress(),
            Venue = $"{f.Company.CompanyName()} Sports Centre",
            Coordinates = new GeoCoordinatesDto
            {
                Type = "Point",
                Latitude = Math.Round(f.Address.Latitude(51.4, 55.4), 6),
                Longitude = Math.Round(f.Address.Longitude(-10.5, -5.9), 6),
                PlaceId = $"ChIJ{f.Random.String2(20, PlaceIdChars)}"
            }
        })
        .RuleFor(x => x.Schedule, f =>
        {
            var start = DateTime.UtcNow.Date.AddDays(f.Random.Int(7, 60));
            return new BjjEventScheduleDto
            {
                StartDate = start,
                EndDate = start.AddDays(f.Random.Int(0, 2)),
                Hours =
                [
                    new BjjEventHoursDto
                    {
                        Day = f.PickRandom<DayOfWeek>(),
                        OpenTime = TimeSpan.FromHours(f.Random.Int(8, 12)),
                        CloseTime = TimeSpan.FromHours(f.Random.Int(14, 20))
                    }
                ]
            };
        })
        .RuleFor(x => x.Pricing, f => new PricingModelDto
        {
            Type = PricingType.Free,
            Amount = 0m,
            Currency = null,
            DurationDays = null
        })
        .RuleFor(x => x.EventUrl, f => $"https://www.{f.Internet.DomainWord()}.ie/events")
        .RuleFor(x => x.ImageUrl, f => $"https://www.{f.Internet.DomainWord()}.ie/images/event.jpg");

    private static Faker<BjjEvent> BjjEventEntityGenerator { get; } = new Faker<BjjEvent>()
        .RuleFor(x => x.Id, _ => ObjectId.GenerateNewId().ToString())
        .RuleFor(x => x.Name, f => $"{f.Address.City()} BJJ {f.PickRandom("Seminar", "Open Mat", "Tournament")}")
        .RuleFor(x => x.Description, f => f.Lorem.Sentence(10, 5))
        .RuleFor(x => x.Type, f => f.PickRandom<BjjEventType>())
        .RuleFor(x => x.Organiser, f => new Organizer
        {
            Name = $"{f.Address.City()} Grappling Academy",
            Website = $"https://www.{f.Internet.DomainWord()}.ie"
        })
        .RuleFor(x => x.Status, _ => EventStatus.Upcoming)
        .RuleFor(x => x.SocialMedia, f => new SocialMedia
        {
            Instagram = $"https://www.instagram.com/{f.Internet.UserName().ToLowerInvariant()}",
            Facebook = $"https://www.facebook.com/{f.Internet.UserName().ToLowerInvariant()}",
        })
        .RuleFor(x => x.County, f => f.PickRandom<County>())
        .RuleFor(x => x.Location, f => new Location
        {
            Address = f.Address.StreetAddress(),
            Venue = $"{f.Company.CompanyName()} Sports Centre",
            Coordinates = new GeoCoordinates
            {
                Latitude = Math.Round(f.Address.Latitude(51.4, 55.4), 6),
                Longitude = Math.Round(f.Address.Longitude(-10.5, -5.9), 6),
                PlaceId = $"ChIJ{f.Random.String2(20, PlaceIdChars)}"
            }
        })
        .RuleFor(x => x.Schedule, f =>
        {
            var start = DateTime.UtcNow.Date.AddDays(f.Random.Int(7, 60));
            return new BjjEventSchedule
            {
                StartDate = start,
                EndDate = start.AddDays(f.Random.Int(0, 2)),
                Hours =
                [
                    new BjjEventHours
                    {
                        Day = f.PickRandom<DayOfWeek>(),
                        OpenTime = TimeSpan.FromHours(f.Random.Int(8, 12)),
                        CloseTime = TimeSpan.FromHours(f.Random.Int(14, 20))
                    }
                ]
            };
        })
        .RuleFor(x => x.Pricing, _ => new PricingModel
        {
            Type = PricingType.Free,
            Amount = 0m,
            Currency = null,
            DurationDays = null
        })
        .RuleFor(x => x.EventUrl, f => $"https://www.{f.Internet.DomainWord()}.ie/events")
        .RuleFor(x => x.ImageUrl, f => $"https://www.{f.Internet.DomainWord()}.ie/images/event.jpg");

    public static BjjEventDto GetValidBjjEventDto() => BjjEventDtoGenerator.Generate();

    public static CreateBjjEventCommand GetValidBjjEventCommand() => new() { Data = GetValidBjjEventDto() };

    public static BjjEvent CreateBjjEvent(Action<BjjEvent>? configure = null)
    {
        var entity = BjjEventEntityGenerator.Generate();
        configure?.Invoke(entity);
        return entity;
    }
}
