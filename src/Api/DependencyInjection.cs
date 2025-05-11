
using System.Text.Json;
using System.Text.Json.Serialization;
using BjjWorld.Api.Extensions;
using BjjWorld.Api.Extensions.Exceptions;
using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Common.Services;
using Prometheus;

namespace Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static WebApplicationBuilder AddApiServices(this WebApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.AddCustomSerilog();
        builder.Services.AddHttpContextAccessor();
        builder.Services.AddControllers()
            .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        // options.JsonSerializerOptions.Converters.Add(new ScheduleTypeConverter());
        // options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
        builder.ConfigureCors();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.ConfigureOpenApi();
        builder.Services.AddSwaggerGen();
        builder.Services.AddExceptionHandler<CustomExceptionHandler>();
        builder.Services.AddProblemDetails();
        builder.Services.AddHealthChecks();
        builder.Services.AddHttpClient();
        builder.Services.AddMetrics();
        builder.Services.ConfigureRateLimit(builder.Configuration);
        builder.Services.AddScoped<ILinkService, LinkService>();
        builder.Services.AddSecurityHeaders(builder.Configuration);

        return builder;
    }

    public static WebApplication UseBjjWorldApp(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        app.UseCustomSerilogRequestLogging();
        app.UseRateLimit();
        app.UseSecurityHeaders();
        app.UseExceptionHandler();
        app.UseOpenApi();
        app.UseCors();
        app.UseHealthChecks();
        app.UseHttpMetrics();
        app.MapMetrics();
        app.MapControllers();

        return app;
    }

}
