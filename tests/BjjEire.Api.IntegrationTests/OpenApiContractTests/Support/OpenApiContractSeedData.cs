// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Entities.Common;
using BjjEire.Domain.Entities.Competitions;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Entities.Stores;
using BjjEire.Domain.Enums;

using MongoDB.Bson;

namespace BjjEire.Api.IntegrationTests.OpenApiContractTests.Support;

internal static class OpenApiContractSeedData
{
    public static async Task SeedAllAsync(ITestDatabaseService database)
    {
        await database.SeedEntitiesAsync(CreateMaximalGym());
        await database.SeedEntitiesAsync(CreateMaximalBjjEvent());
        await database.SeedEntitiesAsync(CreateMaximalCompetition());
        await database.SeedEntitiesAsync(CreateMaximalStore());
    }

    public static Gym CreateMaximalGym() =>
        GymTestDataFactory.CreateGym(g =>
        {
            g.Id = ObjectId.GenerateNewId().ToString();
            g.Name = "Contract Gym";
            g.Description = "Contract gym with every published field populated.";
            g.Status = GymStatus.Active;
            g.County = County.Dublin;
            g.Affiliation = new Affiliation { Name = "Contract Affiliation", Website = "https://affiliation.example.com" };
            g.TrialOffer = new TrialOffer { IsAvailable = true, FreeClasses = 2, FreeDays = 7, Notes = "Contract trial notes" };
            g.Location = new Location
            {
                Address = "1 Contract Street, Dublin",
                Venue = "Contract Venue",
                Coordinates = new GeoCoordinates
                {
                    Coordinates = [-6.260273, 53.349805],
                    PlaceName = "Contract Point",
                    PlaceId = "ChIJContractGym123"
                }
            };
            g.SocialMedia = new SocialMedia
            {
                Instagram = "https://www.instagram.com/contractgym",
                Facebook = "https://www.facebook.com/contractgym",
                X = "https://www.x.com/contractgym",
                YouTube = "https://www.youtube.com/c/contractgym"
            };
            g.OfferedClasses = [ClassCategory.BJJGiAllLevels, ClassCategory.BJJNoGiAllLevels];
            g.Website = "https://gym.example.com";
            g.TimetableUrl = "https://gym.example.com/timetable";
            g.ImageUrl = "https://gym.example.com/image.jpg";
        });

    public static BjjEvent CreateMaximalBjjEvent() =>
        BjjEventTestDataFactory.CreateBjjEvent(e =>
        {
            e.Id = ObjectId.GenerateNewId().ToString();
            e.Name = "Contract BJJ Event";
            e.Description = "Contract event with every published field populated.";
            e.Type = BjjEventType.Seminar;
            e.Organiser = new Organizer { Name = "Contract Organiser", Website = "https://organiser.example.com" };
            e.Status = EventStatus.Upcoming;
            e.StatusReason = "Contract status reason";
            e.SocialMedia = new SocialMedia
            {
                Instagram = "https://www.instagram.com/contractevent",
                Facebook = "https://www.facebook.com/contractevent",
                X = "https://www.x.com/contractevent",
                YouTube = "https://www.youtube.com/c/contractevent"
            };
            e.County = County.Cork;
            e.Location = new Location
            {
                Address = "2 Contract Street, Cork",
                Venue = "Contract Event Venue",
                Coordinates = new GeoCoordinates
                {
                    Coordinates = [-8.486316, 51.896891],
                    PlaceName = "Contract Event Point",
                    PlaceId = "ChIJContractEvent123"
                }
            };
            e.Schedule = new BjjEventSchedule
            {
                StartDate = DateTime.UtcNow.Date.AddDays(10),
                EndDate = DateTime.UtcNow.Date.AddDays(11),
                Hours = [new BjjEventHours { Day = DayOfWeek.Saturday, OpenTime = TimeSpan.FromHours(10), CloseTime = TimeSpan.FromHours(16) }]
            };
            e.Pricing = new PricingModel { Type = PricingType.FlatRate, Amount = 25m, DurationDays = 1, Currency = "EUR" };
            e.EventUrl = "https://event.example.com";
            e.ImageUrl = "https://event.example.com/image.jpg";
            e.IsActive = true;
        });

    public static Competition CreateMaximalCompetition() =>
        CompetitionTestDataFactory.CreateCompetition(c =>
        {
            c.Id = ObjectId.GenerateNewId().ToString();
            c.Slug = "contract-competition";
            c.Name = "Contract Competition";
            c.Description = "Contract competition with every published field populated.";
            c.Organisation = "Contract Organisation";
            c.Country = "Ireland";
            c.WebsiteUrl = "https://competition.example.com";
            c.RegistrationUrl = "https://competition.example.com/register";
            c.LogoUrl = "https://competition.example.com/logo.png";
            c.Tags = ["gi", "nogi"];
            c.StartDate = DateTime.UtcNow.Date.AddDays(30);
            c.EndDate = DateTime.UtcNow.Date.AddDays(31);
            c.IsActive = true;
        });

    public static Store CreateMaximalStore() =>
        StoreTestDataFactory.CreateStore(s =>
        {
            s.Id = ObjectId.GenerateNewId().ToString();
            s.Name = "Contract Store";
            s.Description = "Contract store with every published field populated.";
            s.WebsiteUrl = "https://store.example.com";
            s.LogoUrl = "https://store.example.com/logo.png";
            s.IsActive = true;
        });
}
