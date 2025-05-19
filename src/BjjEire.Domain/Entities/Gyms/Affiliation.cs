
namespace BjjEire.Domain.Entities.Gyms;

public class Affiliation
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("website")]
    public string? Website { get; set; }
}
