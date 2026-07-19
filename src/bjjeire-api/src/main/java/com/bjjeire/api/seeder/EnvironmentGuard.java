package com.bjjeire.api.seeder;

public final class EnvironmentGuard {
    private EnvironmentGuard() {}

    public static boolean isAllowed(boolean force) {
        return isAllowed(resolveEnvironment(), force);
    }

    static boolean isAllowed(String environment, boolean force) {
        if ("Development".equalsIgnoreCase(environment) || force) {
            return true;
        }

        System.err.println("ERROR: Seeder refused — environment is '" + environment + "'.");
        System.err.println("Set ASPNETCORE_ENVIRONMENT=Development or pass --force to override.");
        return false;
    }

    // Keeps the established environment variable contract so the same compose files work
    // for both stacks during the migration.
    private static String resolveEnvironment() {
        String environment = System.getenv("ASPNETCORE_ENVIRONMENT");
        if (environment == null) {
            environment = System.getenv("DOTNET_ENVIRONMENT");
        }
        return environment != null ? environment : "Development";
    }
}
