namespace BjjEire.Infrastructure.Configuration;

public sealed class AzureAdOptions
{
    public const string SectionName = "AzureAd";

    public string Instance { get; init; } = "https://login.microsoftonline.com/";
    public string TenantId { get; init; } = string.Empty;
    public string ClientId { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
}
