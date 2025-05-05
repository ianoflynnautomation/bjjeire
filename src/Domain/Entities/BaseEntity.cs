
using MongoDB.Bson.Serialization.Attributes;

namespace BjjWorld.Domain.Entities;

public abstract class BaseEntity : ParentEntity, IAuditableEntity
{

        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedOnUtc { get; set; }

        [BsonElement("createdBy")]
        public string? CreatedBy { get; set; }

        [BsonElement("updatedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? UpdatedOnUtc { get; set; }

        [BsonElement("updatedBy")]
        public string? UpdatedBy { get; set; }
}