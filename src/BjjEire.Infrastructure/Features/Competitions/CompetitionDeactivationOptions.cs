namespace BjjEire.Infrastructure.Features.Competitions;

public sealed class CompetitionDeactivationOptions
{
    public const string SectionName = "CompetitionDeactivation";

    public TimeSpan Interval { get; set; } = TimeSpan.FromHours(24);

    public TimeSpan InitialDelay { get; set; } = TimeSpan.FromSeconds(30);
}
