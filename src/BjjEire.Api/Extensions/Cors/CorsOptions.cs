namespace BjjEire.Api.Extensions.Cors;

public sealed class CorsOptions
{
    public const string SectionName = "CorsOptions";

    public string[] AllowedOrigins { get; init; } = [];
    public string[] AllowedMethods { get; init; } = [];
    public string[] AllowedHeaders { get; init; } = [];
}
