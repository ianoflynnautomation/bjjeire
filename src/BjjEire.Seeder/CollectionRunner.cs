using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Entities.Gyms;

namespace BjjEire.Seeder;

internal static class CollectionRunner
{
    private static string GymsDataFile()
    {
        const string testFile = "data/gyms.test.json";
        const string prodFile = "data/gyms.json";
        var isDevelopment = string.Equals(
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            "Development",
            StringComparison.OrdinalIgnoreCase);
        return isDevelopment && File.Exists(testFile) ? testFile : prodFile;
    }

    private static readonly (string name, Func<SeederService, Task<int>> run)[] Collections =
    [
        ("Gym",      s => s.SeedAsync<Gym>("Gym", GymsDataFile())),
        ("BjjEvent", s => s.SeedAsync<BjjEvent>("BjjEvent", "data/bjj-events.json")),
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
        foreach (var (_, run) in toRun)
            exitCode |= await run(seeder);

        return exitCode;
    }
}
