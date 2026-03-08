// Shared test data builders for BjjEvent tests.
// Provides a valid BjjEventDto and helpers for constructing
// invalid variants used across multiple test classes.

using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.UnitTests.Common.TestBuilders;

/// <summary>A well-known, valid MongoDB ObjectId string used across all tests.</summary>
internal static class ObjectIds
{
    public const string Valid1 = "507f1f77bcf86cd799439011";
    public const string Valid2 = "507f1f77bcf86cd799439012";
    public const string Invalid = "not-a-valid-objectid";
}

internal static class BjjEventTestData
{
    /// <summary>Returns a fully valid <see cref="BjjEventDto"/> that passes all validation rules.</summary>
    public static BjjEventDto ValidDto(string? id = null) => new()
    {
        Id = id ?? ObjectIds.Valid1,
        Name = "BJJ Open Mat Dublin",
        Description = "Monthly open mat session",
        Type = BjjEventType.OpenMat,
        Organiser = new OrganizerDto
        {
            Name = "Dublin BJJ Club",
            Website = "https://dublinjj.ie"
        },
        Status = EventStatus.Upcoming,
        SocialMedia = new SocialMediaDto(),         // all fields optional / empty is fine
        County = County.Dublin,
        Location = new LocationDto
        {
            Address = "123 Main Street, Dublin 1",
            Venue = "Dublin Sports Arena",
            Coordinates = new GeoCoordinatesDto
            {
                Type = "Point",
                Latitude = 53.3498,
                Longitude = -6.2603
            }
        },
        Schedule = new BjjEventScheduleDto
        {
            StartDate = DateTime.UtcNow.AddDays(14),
            EndDate = DateTime.UtcNow.AddDays(14).AddHours(8),
            Hours =
            [
                new BjjEventHoursDto
                {
                    Day = DayOfWeek.Saturday,
                    OpenTime = TimeSpan.FromHours(10),
                    CloseTime = TimeSpan.FromHours(18)
                }
            ]
        },
        Pricing = new PricingModelDto
        {
            Type = PricingType.Free,
            Amount = 0m,
            Currency = null,
            DurationDays = null
        },
        EventUrl = "https://eventbrite.com/bjjopen",
        ImageUrl = "https://cdn.example.com/event.jpg"
    };

    /// <summary>Returns a valid <see cref="CreateBjjEventCommand"/> wrapping a valid DTO.</summary>
    public static CreateBjjEventCommand ValidCreateCommand() =>
        new() { Data = ValidDto() };

    /// <summary>Creates a minimal <see cref="BjjEvent"/> entity for use in service mocks.</summary>
    public static BjjEvent ValidEntity(string? id = null) =>
        new()
        {
            Id = id ?? ObjectIds.Valid1,
            Name = "BJJ Open Mat Dublin",
            Type = BjjEventType.OpenMat,
            Status = EventStatus.Upcoming,
            County = County.Dublin
        };
}
