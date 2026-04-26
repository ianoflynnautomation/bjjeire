// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


namespace BjjEire.Api.Extensions.OpenApi;

public class AuthSecuritySchemeTransformer(IAuthenticationSchemeProvider schemeProvider) : IOpenApiOperationTransformer
{
    private const string OpenApiBearerSchemeId = "BearerAuth";

    public async Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(operation);
        ArgumentNullException.ThrowIfNull(context);

        IList<object> endpointMetadata = context.Description.ActionDescriptor.EndpointMetadata;
        List<IAuthorizeData> authorizeData = endpointMetadata.OfType<IAuthorizeData>().ToList();
        bool allowAnonymous = endpointMetadata.OfType<IAllowAnonymous>().Any();

        if (allowAnonymous || authorizeData.Count == 0)
        {
            operation.Security = [];
            return;
        }

        operation.Security ??= [];
        OpenApiSecurityRequirement securityRequirement = [];

        IEnumerable<AuthenticationScheme> allRegisteredSchemes = await schemeProvider.GetAllSchemesAsync();

        if (allRegisteredSchemes.Any(s => s.Name == JwtBearerDefaults.AuthenticationScheme))
        {
            securityRequirement.Add(
                new OpenApiSecuritySchemeReference(OpenApiBearerSchemeId),
                []
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
