namespace BjjEire.Seeder;

internal static class ValidationRunner
{
    internal static async Task<int> RunAsync(string? filter)
    {
        var toRun = filter is null
            ? CollectionRunner.All
            : CollectionRunner.All.Where(c => c.Name == filter).ToArray();

        if (toRun.Length == 0)
        {
            await Console.Error.WriteLineAsync($"ERROR: Unknown collection '{filter}'. Valid values: {string.Join(", ", CollectionRunner.All.Select(c => c.Name))}");
            return 1;
        }

        var failed = 0;
        var total = 0;

        foreach (var c in toRun)
        {
            var files = CollectionRunner.ResolveDataSources(c.Slug);
            await Console.Out.WriteLineAsync($"\n── {c.Name} ({files.Length} file{(files.Length == 1 ? "" : "s")}) ──");

            foreach (var file in files)
            {
                total++;
                var error = await EntityLoader.ValidateAsync(c.EntityType, file, EntityLoader.StrictOptions);
                if (error is null)
                {
                    await Console.Out.WriteLineAsync($"  OK    {file}");
                }
                else
                {
                    failed++;
                    await Console.Error.WriteLineAsync($"  FAIL  {file}\n        {error}");
                }
            }
        }

        await Console.Out.WriteLineAsync($"\n{total - failed}/{total} files valid.");
        return failed > 0 ? 1 : 0;
    }
}
