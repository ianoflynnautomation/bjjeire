using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Entities.Competitions;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Entities.Stores;

namespace BjjEire.Seeder;

internal static class CollectionRunner
{
    /// <summary>
    /// Returns every <c>*.json</c> file in <c>data/{slug}/</c>, excluding files
    /// whose names start with <c>_</c> (templates, drafts).
    /// </summary>
    private static string[] ResolveDataSources(string slug)
    {
        var dir = Path.Combine("data", slug);
        if (!Directory.Exists(dir))
            return [];

        return Directory.EnumerateFiles(dir, "*.json", SearchOption.TopDirectoryOnly)
            .Where(f => !Path.GetFileName(f).StartsWith('_'))
            .OrderBy(f => f, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static readonly (string name, string slug, Func<SeederService, string, Task<int>> run)[] Collections =
    [
        ("Gym",         "gyms",         (s, f) => s.SeedAsync<Gym>("Gym", f)),
        ("BjjEvent",    "bjj-events",   (s, f) => s.SeedAsync<BjjEvent>("BjjEvent", f)),
        ("Competition", "competitions", (s, f) => s.SeedAsync<Competition>("Competition", f)),
        ("Store",       "stores",       (s, f) => s.SeedAsync<Store>("Store", f)),
    ];

    internal static async Task<int> RunAsync(SeederService seeder, string? filter)
    {
        var toRun = filter is null
            ? Collections
            : Collections.Where(c => c.name == filter).ToArray();

        if (toRun.Length == 0)
        {
            await Console.Error.WriteLineAsync($"ERROR: Unknown collection '{filter}'. Valid values: {string.Join(", ", Collections.Select(c => c.name))}");
            return 1;
        }

        var exitCode = 0;
        foreach (var (_, slug, run) in toRun)
        {
            foreach (var file in ResolveDataSources(slug))
                exitCode |= await run(seeder, file);
        }

        return exitCode;
    }
}
