
using BjjEire.Api.Extensions.Authentication;

namespace BjjEire.Api.Extensions.OpenApi;

public class AuthSecuritySchemeTransformer(IAuthenticationSchemeProvider schemeProvider) : IOpenApiOperationTransformer {
    private readonly IAuthenticationSchemeProvider _schemeProvider = schemeProvider;
    private const string OpenApiBearerSchemeId = "BearerAuth";
    private const string OpenApiApiKeySchemeId = "ApiKeyAuth";

    public async Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken) {
        ArgumentNullException.ThrowIfNull(operation);
        ArgumentNullException.ThrowIfNull(context);

        var endpointMetadata = context.Description.ActionDescriptor.EndpointMetadata;
        var authorizeData = endpointMetadata.OfType<IAuthorizeData>().ToList();
        var allowAnonymous = endpointMetadata.OfType<IAllowAnonymous>().Any();

        if (allowAnonymous || authorizeData.Count == 0) {
            operation.Security = [];
            return;
        }

        operation.Security ??= [];
        var securityRequirement = new OpenApiSecurityRequirement();
        bool schemeAddedToRequirement = false;

        var allRegisteredSchemes = await _schemeProvider.GetAllSchemesAsync();
        var defaultAuthenticateScheme = await _schemeProvider.GetDefaultAuthenticateSchemeAsync();

        var specifiedSchemes = authorizeData
            .Select(ad => ad.AuthenticationSchemes?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Where(s => s != null && s.Length > 0)
            .SelectMany(s => s!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (specifiedSchemes.Count > 0) {
            foreach (var schemeName in specifiedSchemes) {
                if (schemeName.Equals(JwtBearerDefaults.AuthenticationScheme, StringComparison.OrdinalIgnoreCase) &&
                    allRegisteredSchemes.Any(s => s.Name == JwtBearerDefaults.AuthenticationScheme)) {
                    securityRequirement.Add(
                        new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = OpenApiBearerSchemeId, Type = ReferenceType.SecurityScheme } },
                        Array.Empty<string>()
                    );
                    schemeAddedToRequirement = true;
                }
                else if (schemeName.Equals(ApiKeyAuthenticationDefaults.AuthenticationScheme, StringComparison.OrdinalIgnoreCase) &&
                         allRegisteredSchemes.Any(s => s.Name == ApiKeyAuthenticationDefaults.AuthenticationScheme)) {
                    securityRequirement.Add(
                        new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = OpenApiApiKeySchemeId, Type = ReferenceType.SecurityScheme } },
                        Array.Empty<string>()
                    );
                    schemeAddedToRequirement = true;
                }
            }
        }
        else if (authorizeData.Any(ad => string.IsNullOrWhiteSpace(ad.AuthenticationSchemes) &&
                                        string.IsNullOrWhiteSpace(ad.Policy) &&
                                        !string.IsNullOrEmpty(defaultAuthenticateScheme?.Name))) {
            // Plain [Authorize] attribute without specified schemes or policy, with a default scheme configured
            var schemeToApply = defaultAuthenticateScheme!.Name;
            if (schemeToApply.Equals(JwtBearerDefaults.AuthenticationScheme, StringComparison.OrdinalIgnoreCase)) {
                securityRequirement.Add(
                    new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = OpenApiBearerSchemeId, Type = ReferenceType.SecurityScheme } },
                    Array.Empty<string>()
                );
                schemeAddedToRequirement = true;
            }
            // Could add similar logic for ApiKey if it could be a default
        }
        else if (authorizeData.Any(ad => string.IsNullOrWhiteSpace(ad.AuthenticationSchemes) &&
                                        string.IsNullOrWhiteSpace(ad.Policy) &&
                                        string.IsNullOrEmpty(defaultAuthenticateScheme?.Name) &&
                                        allRegisteredSchemes.Any(s => s.Name == JwtBearerDefaults.AuthenticationScheme))) {
            // Fallback to JWT if no default scheme and JWT is present
            securityRequirement.Add(
                new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = OpenApiBearerSchemeId, Type = ReferenceType.SecurityScheme } },
                Array.Empty<string>()
            );
            schemeAddedToRequirement = true;
        }

        // Add the security requirement only if schemes were added and it's not a duplicate
        if (schemeAddedToRequirement && securityRequirement.Any() &&
            !operation.Security.Any(sr => sr.Keys.Count == securityRequirement.Keys.Count &&
                                         sr.Keys.All(k => securityRequirement.ContainsKey(k)))) {
            operation.Security.Add(securityRequirement);
        }
    }
}
