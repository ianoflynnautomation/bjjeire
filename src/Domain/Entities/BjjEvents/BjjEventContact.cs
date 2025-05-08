

namespace BjjWorld.Domain.Entities.BjjEvents;

public class BjjEventContact
{
     [BsonElement("contactPerson")]
    public string ContactPerson {get; set; } = string.Empty;

    [BsonElement("phone")]
    public string? Phone { get; set; }

    [BsonElement("email")]
    public string? Email { get; set; }

    [BsonElement("website")]
    public string? Website { get; set; }

    [BsonElement("socialMedia")]
    public Dictionary<string, string>? SocialMedia { get; set; } = [];

}