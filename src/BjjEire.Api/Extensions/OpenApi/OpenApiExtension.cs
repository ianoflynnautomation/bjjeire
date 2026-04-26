// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.Attributes;

using Scalar.AspNetCore;

namespace BjjEire.Api.Extensions.OpenApi;

public static class OpenApiExtensions
{
    public const string ApiGroupNameV1 = "v1";
    private const string BearerAuthSchemeId = "BearerAuth";

    public static IServiceCollection AddAppOpenApiServices(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

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
                document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>(StringComparer.OrdinalIgnoreCase);

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

    public static WebApplication UseAppOpenApi(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
        {
            _ = app.MapOpenApi();
            _ = app.MapScalarApiReference();
        }
        return app;
    }
}
