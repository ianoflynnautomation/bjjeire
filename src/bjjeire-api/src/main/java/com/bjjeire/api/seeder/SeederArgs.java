package com.bjjeire.api.seeder;

public record SeederArgs(
        boolean validate, boolean dryRun, boolean force, boolean prune, String collection, boolean help) {
    public static final String USAGE = """
        BjjEire seeder — loads data/*.json into MongoDB.

        Usage: java -jar app.jar --spring.profiles.active=seeder [options]

        Options:
          --validate              Validate data files against Domain entities (strict); no DB writes.
          --dry-run               Report what would change without writing to the database.
          --prune                 Delete documents not present in the JSON sources.
          --force                 Allow running outside the Development environment.
          --collection <Name>     Restrict to one collection: Gym | BjjEvent | Competition | Store.
          --help, -h              Show this help.
        """;

    public record ParseResult(SeederArgs args, String error) {}

    public static ParseResult parse(String[] args) {
        boolean validate = false;
        boolean dryRun = false;
        boolean force = false;
        boolean prune = false;
        boolean help = false;
        String collection = null;

        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--validate" -> validate = true;
                case "--dry-run" -> dryRun = true;
                case "--force" -> force = true;
                case "--prune" -> prune = true;
                case "--help", "-h" -> help = true;
                case "--collection" -> {
                    if (i + 1 >= args.length || args[i + 1].startsWith("--")) {
                        return new ParseResult(null, "Option '--collection' requires a value (e.g. --collection Gym).");
                    }
                    collection = args[++i];
                }
                default -> {
                    // The runner receives the full application argument list; ignore
                    // Spring's own --key=value options instead of failing on them.
                    if (args[i].startsWith("--spring.")) {
                        continue;
                    }
                    return new ParseResult(
                            null, "Unknown argument '" + args[i] + "'. Use --help to see valid options.");
                }
            }
        }

        return new ParseResult(new SeederArgs(validate, dryRun, force, prune, collection, help), null);
    }
}
