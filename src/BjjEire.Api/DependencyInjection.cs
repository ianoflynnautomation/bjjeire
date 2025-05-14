
using System.Text.Json;
using System.Text.Json.Serialization;
using BjjEire.Api.Extensions.Cors;
using BjjEire.Api.Extensions.Exceptions;
using BjjEire.Api.Extensions.HealthChecks;
using BjjEire.Api.Extensions.Logging.Serilog;
using BjjEire.Api.Extensions.OpenApi;
using BjjEire.Api.Extensions.RateLimit;
using BjjEire.Api.Extensions.SecurityHeaders;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Services;
using Prometheus;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class DependencyInjection
{
    public static WebApplicationBuilder AddApiServices(this WebApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.AddCustomSerilog();
        _ = builder.Services.AddHttpContextAccessor();
        _ = builder.Services.AddControllers()
            .AddJsonOptions(options => {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            });
        _ = builder.ConfigureCors();
        _ = builder.Services.AddEndpointsApiExplorer();
        builder.Services.ConfigureOpenApi();
        _ = builder.Services.AddSwaggerGen();
        _ = builder.Services.AddExceptionHandler<CustomExceptionHandler>();
        _ = builder.Services.AddProblemDetails();
        _ = builder.Services.AddHealthChecks();
        _ = builder.Services.AddHttpClient();
        _ = builder.Services.AddMetrics();
        _ = builder.Services.ConfigureRateLimit(builder.Configuration);
        _ = builder.Services.AddScoped<ILinkService, LinkService>();
        _ = builder.Services.AddSecurityHeaders(builder.Configuration);

        return builder;
    }

    public static WebApplication UseBjjWorldApp(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        _ = app.UseCustomSerilogRequestLogging();
        _ = app.UseRateLimit();
        _ = app.UseSecurityHeaders();
        _ = app.UseExceptionHandler();
        _ = app.UseOpenApi();
        _ = app.UseCors();
        _ = app.UseHealthChecks();
        _ = app.UseHttpMetrics();
        _ = app.MapMetrics();
        _ = app.MapControllers();

        return app;
    }

}
