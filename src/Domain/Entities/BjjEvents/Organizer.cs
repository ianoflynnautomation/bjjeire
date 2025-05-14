
namespace BjjWorld.Domain.Entities.BjjEvents;

public class Organizer {
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;
    [BsonElement("website")]
    public string Website { get; set; } = string.Empty;
}
