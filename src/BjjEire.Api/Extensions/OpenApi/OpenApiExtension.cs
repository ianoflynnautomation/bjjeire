using BjjEire.Infrastructure.Configuration;
using Microsoft.OpenApi.Models;
using BjjEire.Api.Attributes;
using Microsoft.Extensions.Options;

namespace BjjEire.Api.Extensions.OpenApi;

public static class OpenApiExtensions {
   public const string ApiGroupNameV1 = "v1";
    private const string BearerAuthSchemeId = "BearerAuth";
    private const string ApiKeyAuthSchemeId = "ApiKeyAuth";

    public static IServiceCollection AddAppOpenApiServices(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);
        var logger = services.BuildServiceProvider().GetService<ILoggerFactory>()?.CreateLogger(nameof(OpenApiExtensions));

        _ = services.AddEndpointsApiExplorer(); // Essential for Open API with controllers or minimal APIs

        _ = services.AddTransient<AuthSecuritySchemeTransformer>();
        _ = services.AddTransient<EndpointMetadataTransformer>();
        _ = services.AddTransient<EnumSchemaTransformer>(); // Assuming this is correct

        _ = services.AddOpenApi(ApiGroupNameV1, options => {
            options.OpenApiVersion = Microsoft.OpenApi.OpenApiSpecVersion.OpenApi3_0;

            _ = options.AddDocumentTransformer((document, context, cancellationToken) => {
                document.Info ??= new OpenApiInfo { Title = "BjjEire API", Version = ApiGroupNameV1, Description = "API for BjjEire services." };
                document.Components ??= new OpenApiComponents();
                document.Components.SecuritySchemes ??= new Dictionary<string, OpenApiSecurityScheme>(StringComparer.OrdinalIgnoreCase);

                // JWT Bearer Scheme
                if (!document.Components.SecuritySchemes.ContainsKey(BearerAuthSchemeId)) {
                    document.Components.SecuritySchemes.Add(BearerAuthSchemeId, new OpenApiSecurityScheme {
                        Type = SecuritySchemeType.Http,
                        Scheme = "bearer",
                        BearerFormat = "JWT",
                        Description = "Enter JWT Bearer token. Example: \"Authorization: Bearer {token}\""
                    });
                }

                // API Key Scheme
                var apiKeyOptions = context.ApplicationServices.GetRequiredService<IOptions<ApiKeyOptions>>()?.Value;
                var apiKeyHeaderName = apiKeyOptions?.HeaderName;

                if (string.IsNullOrWhiteSpace(apiKeyHeaderName)) {
                    logger?.LogWarning("ApiKeyOptions.HeaderName is not configured. Using default 'X-API-KEY' for OpenAPI documentation. Actual authentication may fail if not properly configured.");
                    apiKeyHeaderName = "X-API-KEY"; // Fallback for documentation only
                }

                if (!document.Components.SecuritySchemes.ContainsKey(ApiKeyAuthSchemeId)) {
                    document.Components.SecuritySchemes.Add(ApiKeyAuthSchemeId, new OpenApiSecurityScheme {
                        Type = SecuritySchemeType.ApiKey,
                        In = ParameterLocation.Header,
                        Name = apiKeyHeaderName,
                        Description = $"API Key Authentication. Provide the key in the '{apiKeyHeaderName}' header."
                    });
                }
                return Task.CompletedTask;
            });

            _ = options.AddOperationTransformer<AuthSecuritySchemeTransformer>();
            _ = options.AddOperationTransformer<EndpointMetadataTransformer>();
            _ = options.AddSchemaTransformer<EnumSchemaTransformer>();
        });
        return services;
    }

    public static WebApplication UseAppOpenApi(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        // Serve OpenAPI/Swagger JSON and UI only in non-production environments for security.
        if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker") || app.Environment.IsEnvironment("Local"))
        {
            // This UseSwagger is from Microsoft.AspNetCore.OpenApi if you're using that.
            // It typically exposes endpoints like /openapi/v1.json
            _ = app.UseSwagger(); // This is a Swashbuckle method. For Microsoft.AspNetCore.OpenApi, endpoints are mapped via app.MapOpenApi();

            // If using Microsoft.AspNetCore.OpenApi, you might need app.MapOpenApi() instead of app.UseSwagger() to expose the JSON doc.
            // However, UseSwaggerUI() is often compatible.

            //_ = app.UseSwaggerUI();
            _ = app.UseSwaggerUI(options => {
                // The path to swagger.json depends on AddOpenApi vs AddSwaggerGen
                // For AddOpenApi("v1",...), it's usually /openapi/v1.json
                options.SwaggerEndpoint($"/openapi/{ApiGroupNameV1}.json", $"BjjEire API {ApiGroupNameV1}");
                // If you were using Swashbuckle:
                // options.SwaggerEndpoint($"/swagger/{ApiGroupNameV1}/swagger.json", $"BjjEire API {ApiGroupNameV1}");
                options.RoutePrefix = string.Empty; // Serve Swagger UI at the application root
                options.DisplayRequestDuration();
            });
        }
        return app;
    }
}