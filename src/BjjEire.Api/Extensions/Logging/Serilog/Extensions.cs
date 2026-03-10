using Serilog;
using Serilog.Debugging;
using Serilog.Enrichers.Span;
using Serilog.Events;

namespace BjjEire.Api.Extensions.Logging.Serilog;

public static class Extensions
{
    public static WebApplicationBuilder AddCustomSerilog(this WebApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        if (builder.Environment.IsDevelopment())
        {
            SelfLog.Enable(Console.Error);
        }

        _ = builder.Host.UseSerilog((context, services, loggerConfiguration) => loggerConfiguration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext()
                .Enrich.WithProperty("ApplicationName", context.HostingEnvironment.ApplicationName)
                .Enrich.WithProperty("EnvironmentName", context.HostingEnvironment.EnvironmentName)
                .Enrich.WithMachineName()
                .Enrich.WithThreadId()
                .Enrich.WithSpan()
                .Enrich.WithCorrelationId()
        );

        return builder;
    }

    public static WebApplication UseCustomSerilogRequestLogging(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        _ = app.UseSerilogRequestLogging(options =>
        {
            options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms for TraceId {TraceId}";
            options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
            {
                diagnosticContext.Set("RequestMethod", httpContext.Request.Method);
                diagnosticContext.Set("RequestPath", httpContext.Request.Path.Value ?? string.Empty);
                diagnosticContext.Set("ClientIP", httpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown");
                diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.ToString() ?? "Unknown");
                diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value!);
                diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
                diagnosticContext.Set("TraceId", httpContext.TraceIdentifier);

                var userId = httpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userId))
                {
                    diagnosticContext.Set("UserId", userId);
                }
            };
            options.GetLevel = GetRequestLogLevel;
        });

        return app;
    }


    private static LogEventLevel GetRequestLogLevel(HttpContext httpContext, double elapsed, Exception? ex)
    {
        return ex != null || httpContext.Response.StatusCode >= 500
            ? LogEventLevel.Error
            : httpContext.Response.StatusCode >= 400
            ? LogEventLevel.Warning
            : (httpContext.Request.Path.StartsWithSegments("/health", StringComparison.OrdinalIgnoreCase) &&
            httpContext.Response.StatusCode < 400)
            ? LogEventLevel.Verbose
            : LogEventLevel.Information;
    }
}
