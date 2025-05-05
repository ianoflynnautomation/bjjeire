
namespace BjjWorld.Domain.Entities.Common;

public class Location
{
    [BsonElement("address")]
    public  string Address { get; set; }= string.Empty;

    [BsonElement("city")]
    public string City { get; set; }= string.Empty;

    [BsonElement("countryId")]
    public string Country { get; set; }= string.Empty;

    [BsonElement("postalCode")]
    public string? PostalCode { get; set; }

}