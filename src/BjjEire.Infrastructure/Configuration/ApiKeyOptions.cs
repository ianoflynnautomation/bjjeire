namespace BjjEire.Infrastructure.Configuration;

public class ApiKeyOptions
{
    public const string SectionName = "ApiKeyOptions";

    public string HeaderName { get; set; } = "X-API-KEY";
    
    public string ApiKeyValue { get; set; } = string.Empty;
}