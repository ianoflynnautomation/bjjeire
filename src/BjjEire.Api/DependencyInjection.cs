
using System.Text.Json;
using System.Text.Json.Serialization;
using BjjEire.Api.Extensions.Authentication;
using BjjEire.Api.Extensions.Cors;
using BjjEire.Api.Extensions.Exceptions;
using BjjEire.Api.Extensions.HealthChecks;
using BjjEire.Api.Extensions.Logging.Serilog;
using BjjEire.Api.Extensions.OpenApi;
using BjjEire.Api.Extensions.RateLimit;
using BjjEire.Api.Extensions.SecurityHeaders;
using BjjEire.Infrastructure.Configuration;
using Microsoft.OpenApi.Models;
using Prometheus;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class DependencyInjection {
    public static WebApplicationBuilder AddApiServices(this WebApplicationBuilder builder) {
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
        _ = builder.Services.AddAppOpenApiServices();
        _ = builder.Services.AddSwaggerGen(options => {
            options.SwaggerDoc("v1", new OpenApiInfo {
                Version = "v1",
                Title = "BjjEire API",
                Description = "API for BjjEire services (with Auth)"
            });

            // 1. Define Security Schemes
            // --- JWT Bearer Scheme ---
            options.AddSecurityDefinition("BearerAuth", new OpenApiSecurityScheme {
                Name = "Authorization", // Standard header name for Bearer token
                Type = SecuritySchemeType.Http, // Http type for Bearer
                Scheme = "bearer", // Scheme name ("bearer")
                BearerFormat = "JWT", // Format of the bearer token
                In = ParameterLocation.Header,
                Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
            });

            // --- API Key Scheme ---
            // Fetch ApiKeyOptions to get the configured header name
            var apiKeyOptions = builder.Configuration.GetSection(ApiKeyOptions.SectionName).Get<ApiKeyOptions>();
            var apiKeyHeaderName = apiKeyOptions?.HeaderName ?? "X-API-KEY"; // Use configured or a default

            options.AddSecurityDefinition("ApiKeyAuth", new OpenApiSecurityScheme {
                Type = SecuritySchemeType.ApiKey,
                In = ParameterLocation.Header,
                Name = apiKeyHeaderName, // The actual header name for your API key
                Description = $"API Key Authentication using the '{apiKeyHeaderName}' header."
            });

            // 2. Apply Security Requirements to Operations using an IOperationFilter
            // This filter will add the lock icon and security context to endpoints with [Authorize]
            options.OperationFilter<SecurityRequirementsOperationFilter>();
        });
        _ = builder.Services.AddExceptionHandler<CustomExceptionHandler>();
        _ = builder.Services.AddProblemDetails();
        _ = builder.Services.AddHealthChecks();
        _ = builder.Services.AddHttpClient();
        _ = builder.Services.AddMetrics();
        _ = builder.Services.ConfigureRateLimit(builder.Configuration);
        _ = builder.Services.AddSecurityHeaders(builder.Configuration);
        _ = builder.Services.AddAppAuthentication(builder.Configuration);

        return builder;
    }

    public static WebApplication UseBjjWorldApp(this WebApplication app) {
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
        _ = app.UseAppOpenApi(); ;
        _ = app.UseHealthChecks();
        _ = app.UseHttpMetrics();
        _ = app.MapMetrics();
        _ = app.MapControllers();


        return app;
    }

}
