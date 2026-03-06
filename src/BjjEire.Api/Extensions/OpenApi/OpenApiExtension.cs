
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

                var apiKeyHeaderName = context.ApplicationServices
                    .GetRequiredService<IOptions<ApiKeyOptions>>().Value.HeaderName;

                if (string.IsNullOrWhiteSpace(apiKeyHeaderName)) {
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

    // NOTE: Review whether this Swashbuckle setup is still needed alongside AddAppOpenApiServices above.
    internal static IHostApplicationBuilder ConfigureSwaggerGenWithDoc(this IHostApplicationBuilder builder) {
        _ = builder.Services.AddSwaggerGen(options => {
            options.SwaggerDoc("v1", new OpenApiInfo {
                Version = "v1",
                Title = "BjjEire API",
                Description = "API for BjjEire services (with Auth)"
            });

            options.AddSecurityDefinition(BearerAuthSchemeId, new OpenApiSecurityScheme {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
            });

            var apiKeyOptions = builder.Configuration.GetSection(ApiKeyOptions.SectionName).Get<ApiKeyOptions>();
            var apiKeyHeaderName = apiKeyOptions?.HeaderName ?? "X-API-KEY";

            options.AddSecurityDefinition(ApiKeyAuthSchemeId, new OpenApiSecurityScheme {
                Type = SecuritySchemeType.ApiKey,
                In = ParameterLocation.Header,
                Name = apiKeyHeaderName,
                Description = $"API Key Authentication using the '{apiKeyHeaderName}' header."
            });
            options.OperationFilter<SecurityRequirementsOperationFilter>();
        });

        return builder;
    }

    public static WebApplication UseAppOpenApi(this WebApplication app) {
        ArgumentNullException.ThrowIfNull(app);

        if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker")) {
            _ = app.UseSwagger();
            _ = app.UseSwaggerUI();
        }
        return app;
    }
}
