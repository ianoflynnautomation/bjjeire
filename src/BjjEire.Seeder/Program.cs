using BjjEire.Seeder;

var collectionFilter = args.SkipWhile(a => a != "--collection").Skip(1).FirstOrDefault();

if (args.Contains("--validate"))
{
    Console.WriteLine("Validating data files against Domain entities (strict)...");
    return await ValidationRunner.RunAsync(collectionFilter);
}

var isDryRun = args.Contains("--dry-run");
var isForce = args.Contains("--force");

if (!EnvironmentGuard.IsAllowed(isForce)) return 1;
if (isDryRun) Console.WriteLine("[DRY RUN] No changes will be written to the database.");

var seeder = new SeederService(DatabaseFactory.Build(), isDryRun);

var exitCode = await CollectionRunner.RunAsync(seeder, collectionFilter);
Console.WriteLine(exitCode == 0 ? "\nSeeding completed successfully." : "\nSeeding completed with errors.");
return exitCode;
