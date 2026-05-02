// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.Api.Extensions.OpenApi;

public class EnumSchemaTransformer : IOpenApiSchemaTransformer
{
    public Task TransformAsync(OpenApiSchema schema, OpenApiSchemaTransformerContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(schema);

        if (context.JsonTypeInfo.Type.IsEnum)
        {
            schema.Type = JsonSchemaType.String;
            schema.Format = null;
            schema.Pattern = null;

            Array enumValues = Enum.GetValues(context.JsonTypeInfo.Type);
            foreach (object? item in enumValues)
            {
                string? name = Enum.GetName(context.JsonTypeInfo.Type, item);
                schema.Description += $"{name} = {(int)item}; ";
            }
        }
        return Task.CompletedTask;
    }
}
