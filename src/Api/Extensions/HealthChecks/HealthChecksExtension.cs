using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

namespace BjjWorld.Api.Extensions;

public static class HealthChecksExtensions
{
    internal static WebApplication UseHealthChecks(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        app.MapHealthChecks("/health", new HealthCheckOptions
        {
            ResponseWriter = static async (context, report) =>
            {
                var options = new JsonSerializerOptions { WriteIndented = false };
                context.Response.ContentType = "application/json";
                var result = JsonSerializer.Serialize(new
                {
                    status = report.Status.ToString(),
                    checks = report.Entries.Select(e => new
                    {
                        name = e.Key,
                        status = e.Value.Status.ToString(),
                        description = e.Value.Description, 
                        duration = e.Value.Duration.TotalMilliseconds
                    }),
                    totalDuration = report.TotalDuration.TotalMilliseconds
                }, options);
                await context.Response.WriteAsync(result);
            }
        });
        return app;
    }

}