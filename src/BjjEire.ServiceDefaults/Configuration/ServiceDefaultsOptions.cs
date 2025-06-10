namespace BjjEire.ServiceDefaults.Configuration;

public class ServiceDefaultsOptions {
    public string? ServiceName { get; set; }
    public bool EnablePrometheus { get; set; } = true;

    private string[]? _allowedSchemes;
    public IReadOnlyList<string>? AllowedSchemes {
        get => _allowedSchemes;
        set => _allowedSchemes = value?.ToArray();
    }
}
