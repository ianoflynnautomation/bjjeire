
namespace BjjWorld.Domain.Entities.Common;

public class Contact
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