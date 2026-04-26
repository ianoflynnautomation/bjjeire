// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.Domain.Entities;

public abstract class ParentEntity
{
    private string _id;

    protected ParentEntity()
    {
        _id = UniqueIdentifier.New;
    }

    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id
    {
        get => _id;
        set => _id = string.IsNullOrEmpty(value) ? UniqueIdentifier.New : value;
    }
}
