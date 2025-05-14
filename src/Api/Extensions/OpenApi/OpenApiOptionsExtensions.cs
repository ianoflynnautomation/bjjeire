using BjjEire.Api.Attributes;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;

namespace BjjEire.Api.Extensions.OpenApi;

public static class OpenApiOptionsExtensions {
    public static void AddOperationTransformer(this OpenApiOptions options) {
        ArgumentNullException.ThrowIfNull(options);
        _ = options.AddOperationTransformer((operation, context, cancellationToken) => {
            var enableQuery = context.Description.ActionDescriptor?.FilterDescriptors.Where(x => x.Filter.GetType() == typeof(EnableQueryAttribute)).FirstOrDefault();
            if (enableQuery != null) {
                operation.Parameters ??= [];

                operation.Parameters.Add(new OpenApiParameter {
                    Name = "$top",
                    AllowReserved = true,
                    In = ParameterLocation.Query,
                    Description = "Show only the first n items.",
                    Required = false,
                    Schema = new OpenApiSchema {
                        Minimum = 0,
                        Type = "integer"
                    }
                });
                operation.Parameters.Add(new OpenApiParameter {
                    Name = "$skip",
                    AllowReserved = true,
                    In = ParameterLocation.Query,
                    Description = "Skip the first n items",
                    Required = false,
                    Schema = new OpenApiSchema {
                        Minimum = 0,
                        Type = "integer"
                    }
                });
                operation.Parameters.Add(new OpenApiParameter {
                    Name = "$orderby",
                    AllowReserved = true,
                    In = ParameterLocation.Query,
                    Description = "Order items by property values (LINQ notation)",
                    Example = new OpenApiString("Name, DisplayOrder"),
                    Required = false,
                    Schema = new OpenApiSchema {
                        Type = "string"
                    }
                });
                operation.Parameters.Add(new OpenApiParameter {
                    Name = "$filter",
                    AllowReserved = true,
                    In = ParameterLocation.Query,
                    Description = "Filter items by property values (LINQ notation) ",
                    Example = new OpenApiString("Name == \"John\""),
                    Required = false,
                    Schema = new OpenApiSchema {
                        Type = "string"
                    }
                });
                operation.Parameters.Add(new OpenApiParameter {
                    Name = "$select",
                    AllowReserved = true,
                    In = ParameterLocation.Query,
                    Description = "Select specific properties from the model (LINQ notation)",
                    Example = new OpenApiString("Id, Name"),
                    Required = false,
                    Schema = new OpenApiSchema {
                        Type = "string"
                    }
                });
            }
            return Task.CompletedTask;
        });
    }

    public static void AddContactDocumentTransformer(this OpenApiOptions options, string name, string version) {
        ArgumentNullException.ThrowIfNull(options);
        _ = options.AddDocumentTransformer((document, context, cancellationToken) => {
            document.Info = new OpenApiInfo {
                Description = "BjjEire API",
                Title = name,
                Version = version,
                Contact = new OpenApiContact {
                    Name = name,
                    Email = "support@BjjEire.com",
                    Url = new Uri("https://BjjEire.com")
                }
            };

            return Task.CompletedTask;
        });
    }

    public static void AddClearServerDocumentTransformer(this OpenApiOptions options) {
        ArgumentNullException.ThrowIfNull(options);
        _ = options.AddDocumentTransformer((document, context, cancellationToken) => {
            document.Servers.Clear();
            return Task.CompletedTask;
        });
    }
}

