using BjjEire.Seeder;

var isDryRun         = args.Contains("--dry-run");
var isForce          = args.Contains("--force");
var collectionFilter = args.SkipWhile(a => a != "--collection").Skip(1).FirstOrDefault();

if (!EnvironmentGuard.IsAllowed(isForce)) return 1;
if (isDryRun) Console.WriteLine("[DRY RUN] No changes will be written to the database.");

var seeder = new SeederService(DatabaseFactory.Build(), isDryRun);

var exitCode = await CollectionRunner.RunAsync(seeder, collectionFilter);
Console.WriteLine(exitCode == 0 ? "\nSeeding completed successfully." : "\nSeeding completed with errors.");
return exitCode;
