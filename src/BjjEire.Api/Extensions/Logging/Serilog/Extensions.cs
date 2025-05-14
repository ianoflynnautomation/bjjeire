using Serilog;

namespace BjjEire.Api.Extensions.Logging.Serilog;

public static class Extensions {
    public static WebApplicationBuilder AddCustomSerilog(this WebApplicationBuilder builder) {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.Host.UseSerilog((context, loggerConfiguration) => loggerConfiguration
                .ReadFrom.Configuration(context.Configuration));

        return builder;
    }

    public static WebApplication UseCustomSerilogRequestLogging(this WebApplication app) {
        ArgumentNullException.ThrowIfNull(app);

        _ = app.UseSerilogRequestLogging(options => {
            options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
            options.EnrichDiagnosticContext = (diagnosticContext, httpContext) => {
                diagnosticContext.Set("ClientIP", httpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown");
                diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].ToString() ?? "Unknown");
                // Add other request-specific properties if needed
                //diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
                diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
            };
        });

        return app;
    }
}