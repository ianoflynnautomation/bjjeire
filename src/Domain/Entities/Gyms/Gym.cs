using System.Text.Json.Serialization;
using BjjWorld.Domain.Entities.Common;
using BjjWorld.Domain.Enums;

namespace BjjWorld.Domain.Entities.Gyms;

public class Gym : BaseEntity
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;
    [BsonElement("description")]
    public string? Description { get; set; } = string.Empty;
    [BsonElement("status")]
    public GymStatus Status {get; set;}
    [BsonElement("county")]
    public string County { get; set; } = string.Empty;
    [BsonElement("affiliation")]
    public Affiliation? Affiliation { get; set; } = new();
    [BsonElement("trialOffer")]
    public TrialOffer TrialOffer { get; set; } = new();
    [BsonElement("location")]
    public Location Location { get; set; } = new();
    [BsonElement("socialMedia")]
    public SocialMedia SocialMedia { get; set; } = new();

    [BsonElement("offeredClasses")]
    public List<ClassCategory> OfferedClasses { get; set; } = [];
    [BsonElement("website")]
    public string? Website { get; set; }
    [BsonElement("timetableUrl")]
    public string? TimetableUrl { get; set; }
    [BsonElement("imageUrl")]
    public string? ImageUrl { get; set; }

}