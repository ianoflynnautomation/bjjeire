// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Enums;
using Bogus;

namespace BjjEire.Api.IntegrationTests.Data;

public class BjjEventTestDataFactory
{
    public static CreateBjjEventCommand GetValidBjjEventCommand() => new() { Data = GetValidBjjEventDto() };

    public static BjjEventDto GetValidBjjEventDto()
    {
        var faker = new Faker();
        return new BjjEventDto
        {
            Id = faker.Random.Hexadecimal(24, "").ToLower(),
            // CreatedOnUtc = DateTime.UtcNow.AddDays(-30).ToString("O"),
            // UpdatedOnUtc = DateTime.UtcNow.AddDays(-10).ToString("O"),
            Name = "Dublin BJJ Masterclass Series",
            Description = "Weekly BJJ seminars with Professor Maria Santos at Dublin Grappling Hub.",
            Type = BjjEventType.Seminar,
            Organiser = new OrganizerDto
            {
                Name = "Dublin Grappling Hub",
                Website = "https://www.dublingrappling.com"
            },
            Status = EventStatus.Upcoming,
            StatusReason = "Event is coming soon",
            SocialMedia = new SocialMediaDto
            {
                Instagram = "https://www.instagram.com/dublingrappling",
                Facebook = "https://www.facebook.com/dublingrappling",
                X = "https://x.com/dublingrappling",
                YouTube = "https://www.youtube.com/@dublingrappling"
            },
            County = County.Dublin,
            Location = new LocationDto
            {
                Address = "45 O'Connell Street, Dublin 1, Ireland",
                Venue = "Dublin Grappling Hub",
                Coordinates = new GeoCoordinatesDto
                {
                    Type = "Point",
                    Latitude = 53.349805,
                    Longitude = -6.260273,
                    PlaceName = "Dublin Grappling Hub",
                    PlaceId =
                        $"ChIJ{faker.Random.String2(20, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_")}"
                }
            },
            Schedule = new BjjEventScheduleDto
            {
                ScheduleType = ScheduleType.FixedDate,
                StartDate = DateTime.UtcNow.Date.AddDays(14),
                EndDate = DateTime.UtcNow.Date.AddDays(14),
                Hours = new List<BjjEventHoursDto>
                {
                    new BjjEventHoursDto
                    {
                        Day = DayOfWeek.Wednesday,
                        OpenTime = TimeSpan.Parse("09:00:00"),
                        CloseTime = TimeSpan.Parse("13:00:00")
                    }
                }
            },
            Pricing = new PricingModelDto
            {
                Type = PricingType.PerDay,
                Amount = 45.00m,
                DurationDays = 1,
                Currency = "EUR"
            },
            EventUrl = "https://www.dublingrappling.com/events",
            ImageUrl = "https://www.dublingrappling.com/images/event_poster.jpg"
        };
    }
}
