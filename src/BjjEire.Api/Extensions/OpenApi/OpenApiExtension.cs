
using BjjEire.Api.Attributes;
using BjjEire.Api.Extensions.Authentication;

namespace BjjEire.Api.Extensions.OpenApi;

public static class OpenApiExtensions
{
    public const string ApiGroupNameV1 = "v1";
    private const string BearerAuthSchemeId = "BearerAuth";

    public static IServiceCollection AddAppOpenApiServices(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        _ = services.AddEndpointsApiExplorer();

        _ = services.AddTransient<AuthSecuritySchemeTransformer>();
        _ = services.AddTransient<EndpointMetadataTransformer>();
        _ = services.AddTransient<EnumSchemaTransformer>();

        _ = services.AddOpenApi(ApiGroupNameV1, options =>
        {
            options.OpenApiVersion = Microsoft.OpenApi.OpenApiSpecVersion.OpenApi3_0;

            _ = options.AddDocumentTransformer((document, context, cancellationToken) =>
            {
                document.Info ??= new OpenApiInfo { Title = "BjjEire API", Version = ApiGroupNameV1, Description = "API for BjjEire services." };
                document.Components ??= new OpenApiComponents();
                document.Components.SecuritySchemes ??= new Dictionary<string, OpenApiSecurityScheme>(StringComparer.OrdinalIgnoreCase);

                if (!document.Components.SecuritySchemes.ContainsKey(BearerAuthSchemeId))
                {
                    document.Components.SecuritySchemes.Add(BearerAuthSchemeId, new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.Http,
                        Scheme = "bearer",
                        BearerFormat = "JWT",
                        Description = "Microsoft Entra ID Bearer token. Example: \"Authorization: Bearer {token}\""
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

    internal static IHostApplicationBuilder ConfigureSwaggerGenWithDoc(this IHostApplicationBuilder builder)
    {
        _ = builder.Services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Version = "v1",
                Title = "BjjEire API",
                Description = "API for BjjEire services (with Auth)"
            });

            options.AddSecurityDefinition(BearerAuthSchemeId, new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Microsoft Entra ID Bearer token. Example: \"Authorization: Bearer {token}\""
            });

            options.OperationFilter<SecurityRequirementsOperationFilter>();
        });

        return builder;
    }

    public static WebApplication UseAppOpenApi(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
        {
            _ = app.UseSwagger();
            _ = app.UseSwaggerUI();
        }
        return app;
    }
}
