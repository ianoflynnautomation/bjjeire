namespace BjjEire.Api.Constants;

public static class FeatureFlags
{
    public const string BjjEvents = "BjjEvents";
    public const string Gyms = "Gyms";
    public const string Competitions = "Competitions";

    public static readonly IReadOnlyList<string> FrontendFlags =
    [
        BjjEvents,
        Gyms,
        Competitions,
    ];
}
