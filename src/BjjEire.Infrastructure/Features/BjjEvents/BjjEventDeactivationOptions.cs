namespace BjjEire.Infrastructure.Features.BjjEvents;

public sealed class BjjEventDeactivationOptions
{
    public const string SectionName = "BjjEventDeactivation";

    public TimeSpan Interval { get; set; } = TimeSpan.FromHours(24);

    public TimeSpan InitialDelay { get; set; } = TimeSpan.FromSeconds(30);
}
