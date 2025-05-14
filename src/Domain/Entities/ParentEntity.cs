
using SharedKernel.Attributes;

namespace BjjWorld.Domain.Entities;
public abstract class ParentEntity {
    private string _id;

    protected ParentEntity() {
        _id = UniqueIdentifier.New;
    }

    // [BsonId]
    // [BsonRepresentation(BsonType.ObjectId)]
    [DBFieldName("_id")]
    public string Id {
        get => _id;
        set => _id = string.IsNullOrEmpty(value) ? UniqueIdentifier.New : value;
    }
}