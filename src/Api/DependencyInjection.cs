
using System.Text.Json;
using System.Text.Json.Serialization;
using BjjWorld.Api.Extensions.Cors;
using BjjWorld.Api.Extensions.Exceptions;
using BjjWorld.Api.Extensions.HealthChecks;
using BjjWorld.Api.Extensions.Logging.Serilog;
using BjjWorld.Api.Extensions.OpenApi;
using BjjWorld.Api.Extensions.RateLimit;
using BjjWorld.Api.Extensions.SecurityHeaders;
using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Common.Services;
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
