namespace BjjEire.Seeder;

internal static class EnvironmentGuard
{
    internal static bool IsAllowed(bool isForce)
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? "Development";

        if (environment.Equals("Development", StringComparison.OrdinalIgnoreCase) || isForce)
            return true;

        Console.Error.WriteLine($"ERROR: Seeder refused — environment is '{environment}'.");
        Console.Error.WriteLine("       Set ASPNETCORE_ENVIRONMENT=Development or pass --force to override.");
        return false;
    }
}
