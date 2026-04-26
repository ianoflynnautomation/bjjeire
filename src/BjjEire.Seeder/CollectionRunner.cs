// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Domain.Entities.BjjEvents;
using BjjEire.Domain.Entities.Competitions;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Entities.Stores;

namespace BjjEire.Seeder;

internal static class CollectionRunner
{
    internal sealed record Collection(string Name, string Slug, Type EntityType, Func<SeederService, string, Task<int>> Seed);

    internal static readonly Collection[] All =
    [
        new("Gym",         "gyms",         typeof(Gym),         (s, f) => s.SeedAsync<Gym>("Gym", f)),
        new("BjjEvent",    "bjj-events",   typeof(BjjEvent),    (s, f) => s.SeedAsync<BjjEvent>("BjjEvent", f)),
        new("Competition", "competitions", typeof(Competition), (s, f) => s.SeedAsync<Competition>("Competition", f)),
        new("Store",       "stores",       typeof(Store),       (s, f) => s.SeedAsync<Store>("Store", f)),
    ];

    /// <summary>
    /// Returns every <c>*.json</c> file in <c>data/{slug}/</c>, excluding files
    /// whose names start with <c>_</c> (templates, drafts).
    /// </summary>
    internal static string[] ResolveDataSources(string slug)
    {
        string dir = Path.Combine("data", slug);
        if (!Directory.Exists(dir))
            return [];

        return Directory.EnumerateFiles(dir, "*.json", SearchOption.TopDirectoryOnly)
            .Where(f => !Path.GetFileName(f).StartsWith('_'))
            .OrderBy(f => f, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    internal static async Task<int> RunAsync(SeederService seeder, string? filter)
    {
        Collection[] toRun = filter is null
            ? All
            : All.Where(c => c.Name == filter).ToArray();

        if (toRun.Length == 0)
        {
            await Console.Error.WriteLineAsync($"ERROR: Unknown collection '{filter}'. Valid values: {string.Join(", ", All.Select(c => c.Name))}");
            return 1;
        }

        int exitCode = 0;
        foreach (Collection? c in toRun)
        {
            foreach (string file in ResolveDataSources(c.Slug))
                exitCode |= await c.Seed(seeder, file);
        }

        return exitCode;
    }
}
