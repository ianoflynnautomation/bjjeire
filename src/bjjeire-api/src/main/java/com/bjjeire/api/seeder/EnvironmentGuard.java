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
        System.err.println("Set BJJ_ENVIRONMENT=Development (or pass --force) to override.");
        return false;
    }

    // Fail-closed: when no environment is configured we assume Production and refuse to seed.
    // BJJ_ENVIRONMENT is the Java-native variable; ASPNETCORE_ENVIRONMENT / DOTNET_ENVIRONMENT
    // are honoured so shared compose files keep working during the migration.
    private static String resolveEnvironment() {
        String environment = firstNonBlank(
                System.getenv("BJJ_ENVIRONMENT"),
                System.getenv("ASPNETCORE_ENVIRONMENT"),
                System.getenv("DOTNET_ENVIRONMENT"));
        return environment != null ? environment : "Production";
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
