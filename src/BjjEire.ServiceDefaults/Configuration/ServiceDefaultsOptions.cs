namespace BjjEire.ServiceDefaults.Configuration;

public class ServiceDefaultsOptions
{
    public string? ServiceName { get; set; }
    public bool EnablePrometheus { get; set; } = true;
    public IReadOnlyList<string>? AllowedSchemes { get; set; }
}
