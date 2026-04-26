// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.Domain.Entities.Stores;

public class Store : BaseEntity
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("websiteUrl")]
    public string WebsiteUrl { get; set; } = string.Empty;

    [BsonElement("logoUrl")]
    public string? LogoUrl { get; set; }

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

}
