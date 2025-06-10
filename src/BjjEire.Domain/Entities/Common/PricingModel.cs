using BjjEire.Domain.Enums;

namespace BjjEire.Domain.Entities.Common;

public class PricingModel {
    [BsonElement("type")]
    public PricingType Type { get; set; }

    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("durationDays")]
    public int? DurationDays { get; set; }

    [BsonElement("urrency")]
    public string? Currency { get; set; } = "EUR";
}
