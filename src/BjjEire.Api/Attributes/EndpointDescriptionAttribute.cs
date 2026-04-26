// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.Api.Attributes;

[AttributeUsage(AttributeTargets.Method)]
public sealed class EndpointDescriptionAttribute(string description) : Attribute
{
    public string Description { get; } = description;
}

[AttributeUsage(AttributeTargets.Method)]
public sealed class EndpointNameAttribute(string name) : Attribute
{
    public string Name { get; } = name;
}

public class EndpointMetadataTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(operation);
        if (context.Description.ActionDescriptor is ControllerActionDescriptor actionDescriptor)
        {
            EndpointDescriptionAttribute? descriptionAttr = actionDescriptor.EndpointMetadata.OfType<EndpointDescriptionAttribute>().FirstOrDefault();
            if (descriptionAttr != null)
            {
                operation.Description = descriptionAttr.Description;
                operation.Summary = descriptionAttr.Description;
            }

            EndpointNameAttribute? nameAttr = actionDescriptor.EndpointMetadata.OfType<EndpointNameAttribute>().FirstOrDefault();
            if (nameAttr != null)
            {
                operation.OperationId = nameAttr.Name;
            }
        }

        return Task.CompletedTask;
    }
}
