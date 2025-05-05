namespace BjjWorld.Api.Extensions;

public class SecurityHeaderOptions
{
    public bool Enable { get; set; }
    public SecurityHeaders Headers { get; set; } = default!;
}