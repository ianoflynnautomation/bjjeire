
namespace BjjEire.Api.Extensions.HealthChecks;

public static class HealthChecksExtensions
{
    private static readonly JsonSerializerOptions HealthCheckSerializerOptions = new()
    {
        WriteIndented = false,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static WebApplication UseAppHealthChecks(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        _ = app.MapHealthChecks("/health", new HealthCheckOptions
        {
            ResponseWriter = static async (context, report) =>
            {
                context.Response.ContentType = "application/json";

                var response = new
                {
                    Status = report.Status.ToString(),
                    Checks = report.Entries.Select(entry => new
                    {
                        Name = entry.Key,
                        Status = entry.Value.Status.ToString(),
                        entry.Value.Description,
                        DurationMs = entry.Value.Duration.TotalMilliseconds,
                        entry.Value.Tags,
                    }),
                    TotalDurationMs = report.TotalDuration.TotalMilliseconds
                };

                await context.Response.WriteAsJsonAsync(response, HealthCheckSerializerOptions);
            },
            ResultStatusCodes =
            {
                [HealthStatus.Healthy] = StatusCodes.Status200OK,
                [HealthStatus.Degraded] = StatusCodes.Status200OK,
                [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
            },
            AllowCachingResponses = false
        });
        return app;
    }


    public static IServiceCollection AddAppHealthChecks(this IServiceCollection services)
    {
        _ = services.AddHealthChecks();
        return services;
    }

}