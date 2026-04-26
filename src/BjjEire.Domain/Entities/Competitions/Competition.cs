// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

namespace BjjEire.Domain.Entities.Competitions;


public class Competition : BaseEntity
{
    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("organisation")]
    public string Organisation { get; set; } = string.Empty;

    [BsonElement("country")]
    public string Country { get; set; } = "Ireland";

    [BsonElement("websiteUrl")]
    public string WebsiteUrl { get; set; } = string.Empty;

    [BsonElement("registrationUrl")]
    public string? RegistrationUrl { get; set; }

    [BsonElement("logoUrl")]
    public string? LogoUrl { get; set; }

    [BsonElement("tags")]
    public List<string> Tags { get; set; } = [];

    [BsonElement("startDate")]
    public DateTime? StartDate { get; set; }

    [BsonElement("endDate")]
    public DateTime? EndDate { get; set; }

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;
}
