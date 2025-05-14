
namespace BjjWorld.Infrastructure.Configuration;

public class BackendAPIOptions {
    public const string SectionName = "BackendApiOptions";
    public bool Enabled { get; set; }
    public string SecretKey { get; set; } = string.Empty;
    public bool ValidateIssuer { get; set; }
    public string ValidIssuer { get; set; } = string.Empty;
    public bool ValidateAudience { get; set; }
    public string ValidAudience { get; set; } = string.Empty;
    public bool ValidateLifetime { get; set; }
    public bool ValidateIssuerSigningKey { get; set; }
    public int ExpiryInMinutes { get; set; }
    public bool SystemModel { get; set; }
}