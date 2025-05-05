
using SharedKernel.Extensions;

namespace BjjWorld.Api.Extensions;

public static class OpenApiExtension
{
    internal static void ConfigureOpenApi(this IServiceCollection services)
    {
        services.AddOpenApi(ApiConstants.ApiGroupNameV1, options =>
        {
            options.OpenApiVersion = Microsoft.OpenApi.OpenApiSpecVersion.OpenApi3_0;
            options.AddContactDocumentTransformer("BjjWorld Backend API", ApiConstants.ApiGroupNameV1);
            options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
            options.AddSchemaTransformer<EnumSchemaTransformer>();
            options.AddOperationTransformer();
            options.AddClearServerDocumentTransformer();
        });
    }

    internal static WebApplication UseOpenApi(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        return app;
    }
}