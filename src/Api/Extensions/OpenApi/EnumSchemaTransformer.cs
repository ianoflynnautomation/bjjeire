using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Models;

namespace BjjWorld.Api.Extensions.OpenApi;

public class EnumSchemaTransformer : IOpenApiSchemaTransformer {
    public Task TransformAsync(OpenApiSchema schema, OpenApiSchemaTransformerContext context, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(schema);

        if (context.JsonTypeInfo.Type.IsEnum) {
            var enumValues = Enum.GetValues(context.JsonTypeInfo.Type);
            foreach (var item in enumValues) {
                var name = Enum.GetName(context.JsonTypeInfo.Type, item);
                schema.Description += $"{(int)item} - {name}; ";
            }
        }
        return Task.CompletedTask;
    }
}
