// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Seeder;

string? collectionFilter = args.SkipWhile(a => a != "--collection").Skip(1).FirstOrDefault();

if (args.Contains("--validate"))
{
    Console.WriteLine("Validating data files against Domain entities (strict)...");
    return await ValidationRunner.RunAsync(collectionFilter);
}

bool isDryRun = args.Contains("--dry-run");
bool isForce = args.Contains("--force");

if (!EnvironmentGuard.IsAllowed(isForce)) return 1;
if (isDryRun) Console.WriteLine("[DRY RUN] No changes will be written to the database.");

SeederService seeder = new(DatabaseFactory.Build(), isDryRun);

int exitCode = await CollectionRunner.RunAsync(seeder, collectionFilter);
Console.WriteLine(exitCode == 0 ? "\nSeeding completed successfully." : "\nSeeding completed with errors.");
return exitCode;
