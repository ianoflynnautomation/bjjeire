using BjjEire.Domain.Enums;

namespace BjjEire.Domain.Entities.Competitions;

// Indexes: slug (unique), isActive

public class Competition : BaseEntity
{
    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("organisation")]
    public CompetitionOrganisation Organisation { get; set; }

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
