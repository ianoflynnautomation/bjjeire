
using BjjEire.Api.Attributes;
using BjjEire.Api.Extensions.Authentication;
using BjjEire.Infrastructure.Configuration;

namespace BjjEire.Api.Extensions.OpenApi;

public static class OpenApiExtensions {
    public const string ApiGroupNameV1 = "v1";
    private const string BearerAuthSchemeId = "BearerAuth";
    private const string ApiKeyAuthSchemeId = "ApiKeyAuth";

    public static IServiceCollection AddAppOpenApiServices(this IServiceCollection services) {
        ArgumentNullException.ThrowIfNull(services);
        var logger = services.BuildServiceProvider().GetService<ILoggerFactory>()?.CreateLogger(nameof(OpenApiExtensions));

        _ = services.AddEndpointsApiExplorer();

        _ = services.AddTransient<AuthSecuritySchemeTransformer>();
        _ = services.AddTransient<EndpointMetadataTransformer>();
        _ = services.AddTransient<EnumSchemaTransformer>();

        _ = services.AddOpenApi(ApiGroupNameV1, options => {
            options.OpenApiVersion = Microsoft.OpenApi.OpenApiSpecVersion.OpenApi3_0;

            _ = options.AddDocumentTransformer((document, context, cancellationToken) => {
                document.Info ??= new OpenApiInfo { Title = "BjjEire API", Version = ApiGroupNameV1, Description = "API for BjjEire services." };
                document.Components ??= new OpenApiComponents();
                document.Components.SecuritySchemes ??= new Dictionary<string, OpenApiSecurityScheme>(StringComparer.OrdinalIgnoreCase);

                if (!document.Components.SecuritySchemes.ContainsKey(BearerAuthSchemeId)) {
                    document.Components.SecuritySchemes.Add(BearerAuthSchemeId, new OpenApiSecurityScheme {
                        Type = SecuritySchemeType.Http,
                        Scheme = "bearer",
                        BearerFormat = "JWT",
                        Description = "Enter JWT Bearer token. Example: \"Authorization: Bearer {token}\""
                    });
                }

                var apiKeyOptions = context.ApplicationServices.GetRequiredService<IOptions<ApiKeyOptions>>()?.Value;
                var apiKeyHeaderName = apiKeyOptions?.HeaderName;

                if (string.IsNullOrWhiteSpace(apiKeyHeaderName)) {
                    logger?.LogWarning("ApiKeyOptions.HeaderName is not configured. Using default 'X-API-KEY' for OpenAPI documentation. Actual authentication may fail if not properly configured.");
                    apiKeyHeaderName = "X-API-KEY";
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

    internal static IHostApplicationBuilder ConfigureSwaggerGenWithDoc(this IHostApplicationBuilder builder) {

        _ = builder.Services.AddSwaggerGen(options => {
            options.SwaggerDoc("v1", new OpenApiInfo {
                Version = "v1",
                Title = "BjjEire API",
                Description = "API for BjjEire services (with Auth)"
            });

            options.AddSecurityDefinition("BearerAuth", new OpenApiSecurityScheme {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
            });

            var apiKeyOptions = builder.Configuration.GetSection(ApiKeyOptions.SectionName).Get<ApiKeyOptions>();
            var apiKeyHeaderName = apiKeyOptions?.HeaderName ?? "X-API-KEY";

            options.AddSecurityDefinition("ApiKeyAuth", new OpenApiSecurityScheme {
                Type = SecuritySchemeType.ApiKey,
                In = ParameterLocation.Header,
                Name = apiKeyHeaderName,
                Description = $"API Key Authentication using the '{apiKeyHeaderName}' header."
            });
            // This filter will add the lock icon and security context to endpoints with [Authorize]
            options.OperationFilter<SecurityRequirementsOperationFilter>();
        });

        return builder;
    }

    public static WebApplication UseAppOpenApi(this WebApplication app) {
        ArgumentNullException.ThrowIfNull(app);

        if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker")) {
            _ = app.UseSwagger();
            _ = app.UseSwaggerUI();
            // _ = app.UseSwaggerUI(options => {
            //     // The path to swagger.json depends on AddOpenApi vs AddSwaggerGen
            //     // For AddOpenApi("v1",...), it's usually /openapi/v1.json
            //     options.SwaggerEndpoint($"/openapi/{ApiGroupNameV1}.json", $"BjjEire API {ApiGroupNameV1}");
            //     // If you were using Swashbuckle:
            //     // options.SwaggerEndpoint($"/swagger/{ApiGroupNameV1}/swagger.json", $"BjjEire API {ApiGroupNameV1}");
            //     options.RoutePrefix = string.Empty; // Serve Swagger UI at the application root
            //     options.DisplayRequestDuration();
            // });
        }
        return app;
    }
}
