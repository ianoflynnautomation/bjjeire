using System.Text.Json.Serialization;

namespace BjjEire.Domain.Entities;

public abstract class BaseEntity : ParentEntity, IAuditableEntity
{

    [BsonElement("createdAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    [JsonPropertyName("createdAt")]
    public DateTime CreatedOnUtc { get; set; }

    [BsonElement("createdBy")]
    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [BsonElement("updatedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedOnUtc { get; set; }

    [BsonElement("updatedBy")]
    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }
}
