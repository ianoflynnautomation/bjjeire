
using BjjEire.Api.Extensions.Authentication;
using BjjEire.Api.Extensions.Cors;
using BjjEire.Api.Extensions.Exceptions;
using BjjEire.Api.Extensions.HealthChecks;
using BjjEire.Api.Extensions.Logging.Serilog;
using BjjEire.Api.Extensions.OpenApi;
using BjjEire.Api.Extensions.RateLimit;
using BjjEire.Api.Extensions.SecurityHeaders;
using BjjEire.Api.Infrastructure;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class DependencyInjection
{
    public static WebApplicationBuilder AddApiServices(this WebApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);
        var env = builder.Environment;

        _ = builder.AddCustomSerilog();
        _ = builder.Services.AddHttpContextAccessor();

        _ = builder.Services.Configure<RouteOptions>(options =>
        {
            options.LowercaseUrls = true;
            options.LowercaseQueryStrings = true;
        });

        _ = builder.Services.AddControllers(options =>
            {
                options.Conventions.Add(new GlobalProducesResponseTypeConvention());
            })
            .AddJsonOptions(jsonOptions =>
            {
                jsonOptions.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                jsonOptions.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            })
            .ConfigureApplicationPartManager(manager =>
                manager.FeatureProviders.Add(new DevelopmentOnlyControllerFeatureProvider(env)));

        _ = builder.Services.Configure<ApiBehaviorOptions>(options =>
            options.SuppressModelStateInvalidFilter = true);

        _ = builder.ConfigureCors();
        _ = builder.Services.AddEndpointsApiExplorer();
        _ = builder.Services.AddAppOpenApiServices();
        _ = builder.ConfigureSwaggerGenWithDoc();
        _ = builder.Services.AddExceptionHandler<CustomExceptionHandler>();
        _ = builder.Services.AddProblemDetails();
        _ = builder.Services.AddAppHealthChecks();
        _ = builder.Services.AddHttpClient();
        _ = builder.Services.AddMetrics();
        _ = builder.Services.ConfigureRateLimit(builder.Configuration);
        _ = builder.Services.AddSecurityHeaders(builder.Configuration);
        _ = builder.Services.AddAppAuthentication(builder.Configuration);

        return builder;
    }

    public static WebApplication UseBjjEiredApp(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        // NOTE: Middleware Order is IMPORTANT!
        _ = app.UseExceptionHandler();
        _ = app.UseSecurityHeaders();
        _ = app.UseCustomSerilogRequestLogging();
        _ = app.UseRouting();
        _ = app.UseCors();
        _ = app.UseRateLimit();
        _ = app.UseAuthentication();
        _ = app.UseAuthorization();
        _ = app.UseAppOpenApi();
        _ = app.UseAppHealthChecks();
        _ = app.UseHttpMetrics();
        _ = app.MapMetrics();
        _ = app.MapControllers();

        return app;
    }

}
