// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


using BjjEire.Api.Controllers;
using BjjEire.Api.Extensions.Authentication;
using BjjEire.Api.Extensions.Cors;
using BjjEire.Api.Extensions.Exceptions;
using BjjEire.Api.Extensions.HealthChecks;
using BjjEire.Api.Extensions.Logging.Serilog;
using BjjEire.Api.Extensions.OpenApi;
using BjjEire.Api.Extensions.RateLimit;
using BjjEire.Api.Extensions.ReadOnlyMode;
using BjjEire.Api.Extensions.SecurityHeaders;

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

        _ = builder.Services.Configure<RouteOptions>(options =>
        {
            options.LowercaseUrls = true;
            options.LowercaseQueryStrings = true;
        });

        _ = builder.Services.AddControllers(options => options.Conventions.Add(new GlobalProducesResponseTypeConvention()))
            .AddJsonOptions(jsonOptions =>
            {
                jsonOptions.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                jsonOptions.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            });

        _ = builder.Services.Configure<ApiBehaviorOptions>(options =>
            options.SuppressModelStateInvalidFilter = true);

        _ = builder.ConfigureCors();
        _ = builder.Services.AddAppOpenApiServices();
        _ = builder.Services.AddExceptionHandler<CustomExceptionHandler>();
        _ = builder.Services.AddProblemDetails();
        _ = builder.Services.AddAppHealthChecks();
        _ = builder.Services.AddHttpClient();
        _ = builder.Services.AddMetrics();
        _ = builder.Services.ConfigureRateLimit(builder.Configuration);
        _ = builder.Services.AddCustomSecurityHeaders();
        _ = builder.Services.AddAppAuthentication(builder.Configuration);
        _ = builder.Services.AddAppAuthorization();
        _ = builder.Services.AddFeatureManagement(builder.Configuration.GetSection("FeatureManagement"));
        _ = builder.Services.Configure<DonationOptions>(builder.Configuration.GetSection("Donation"));
        _ = builder.Services.AddReadOnlyMode(builder.Configuration);

        return builder;
    }

    public static WebApplication UseBjjEireApp(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        _ = app.UseExceptionHandler();
        _ = app.UseSecurityHeaders();
        _ = app.UseCustomSerilogRequestLogging();
        _ = app.UseRouting();
        _ = app.UseCors();
        _ = app.UseRateLimit();
        _ = app.UseReadOnlyMode();
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
