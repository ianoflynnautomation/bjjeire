
namespace BjjEire.Api.Extensions.OpenApi;

public class AuthSecuritySchemeTransformer(IAuthenticationSchemeProvider schemeProvider) : IOpenApiOperationTransformer
{
    private const string OpenApiBearerSchemeId = "BearerAuth";

    public async Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(operation);
        ArgumentNullException.ThrowIfNull(context);

        var endpointMetadata = context.Description.ActionDescriptor.EndpointMetadata;
        var authorizeData = endpointMetadata.OfType<IAuthorizeData>().ToList();
        var allowAnonymous = endpointMetadata.OfType<IAllowAnonymous>().Any();

        if (allowAnonymous || authorizeData.Count == 0)
        {
            operation.Security = [];
            return;
        }

        operation.Security ??= [];
        var securityRequirement = new OpenApiSecurityRequirement();

        var allRegisteredSchemes = await schemeProvider.GetAllSchemesAsync();

        if (allRegisteredSchemes.Any(s => s.Name == JwtBearerDefaults.AuthenticationScheme))
        {
            securityRequirement.Add(
                new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = OpenApiBearerSchemeId, Type = ReferenceType.SecurityScheme } },
                Array.Empty<string>()
            );
        }

        if (securityRequirement.Any() &&
            !operation.Security.Any(sr => sr.Keys.Count == securityRequirement.Keys.Count &&
                                         sr.Keys.All(k => securityRequirement.ContainsKey(k))))
        {
            operation.Security.Add(securityRequirement);
        }
    }
}
