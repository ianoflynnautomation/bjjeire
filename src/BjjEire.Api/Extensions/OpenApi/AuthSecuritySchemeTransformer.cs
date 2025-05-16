using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Models;
using BjjEire.Api.Extensions.Authentication;

namespace BjjEire.Api.Extensions.OpenApi;

public class AuthSecuritySchemeTransformer(IAuthenticationSchemeProvider schemeProvider) : IOpenApiOperationTransformer
{
    private readonly IAuthenticationSchemeProvider _schemeProvider = schemeProvider ?? throw new ArgumentNullException(nameof(schemeProvider));
    private const string OpenApiBearerSchemeId = "BearerAuth"; // Must match ID in OpenApiExtensions
    private const string OpenApiApiKeySchemeId = "ApiKeyAuth";   // Must match ID in OpenApiExtensions

    public async Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(operation);
        ArgumentNullException.ThrowIfNull(context);

        var endpointMetadata = context.Description.ActionDescriptor.EndpointMetadata;
        var authorizeData = endpointMetadata.OfType<IAuthorizeData>().ToList();
        var allowAnonymous = endpointMetadata.OfType<IAllowAnonymous>().Any();

        if (allowAnonymous || authorizeData.Count == 0)
        {
            operation.Security = []; // Explicitly clear for anonymous
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

        if (specifiedSchemes.Any())
        {
            foreach (var schemeName in specifiedSchemes)
            {
                if (schemeName.Equals(JwtBearerDefaults.AuthenticationScheme, StringComparison.OrdinalIgnoreCase) &&
                    allRegisteredSchemes.Any(s => s.Name == JwtBearerDefaults.AuthenticationScheme))
                {
                    securityRequirement.Add(
                        new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = OpenApiBearerSchemeId, Type = ReferenceType.SecurityScheme } },
                        Array.Empty<string>()
                    );
                    schemeAddedToRequirement = true;
                }
                else if (schemeName.Equals(ApiKeyAuthenticationDefaults.AuthenticationScheme, StringComparison.OrdinalIgnoreCase) &&
                         allRegisteredSchemes.Any(s => s.Name == ApiKeyAuthenticationDefaults.AuthenticationScheme))
                {
                    securityRequirement.Add(
                        new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = OpenApiApiKeySchemeId, Type = ReferenceType.SecurityScheme } },
                        Array.Empty<string>()
                    );
                    schemeAddedToRequirement = true;
                }
            }
        }
        else if (authorizeData.Any(ad => string.IsNullOrWhiteSpace(ad.AuthenticationSchemes) && string.IsNullOrWhiteSpace(ad.Policy)))
        {
            // Plain [Authorize] attribute without specified schemes or policy.
            // Apply the default scheme if configured, otherwise try common ones like JWT.
            string? schemeToApply = defaultAuthenticateScheme?.Name;

            if (string.IsNullOrEmpty(schemeToApply) && allRegisteredSchemes.Any(s => s.Name == JwtBearerDefaults.AuthenticationScheme))
            {
                schemeToApply = JwtBearerDefaults.AuthenticationScheme; // Fallback to JWT if no default and JWT is present
            }

            if (!string.IsNullOrEmpty(schemeToApply))
            {
                 if (schemeToApply.Equals(JwtBearerDefaults.AuthenticationScheme, StringComparison.OrdinalIgnoreCase)) {
                    securityRequirement.Add(
                        new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = OpenApiBearerSchemeId, Type = ReferenceType.SecurityScheme } },
                        Array.Empty<string>()
                    );
                    schemeAddedToRequirement = true;
                 }
                 // Could add similar logic for ApiKey if it could be a default
            }
        }
        // Note: If [Authorize(Policy="MyPolicy")] is used, this transformer currently won't add schemes
        // unless the policy implicitly defines schemes that `IAuthenticationSchemeProvider` can report,
        // or you enhance this to understand your policies.

        if (schemeAddedToRequirement && securityRequirement.Any())
        {
            // Check if this exact requirement already exists to prevent duplicates
            if (!operation.Security.Any(sr => sr.Keys.Count == securityRequirement.Keys.Count && sr.Keys.All(k => securityRequirement.ContainsKey(k))))
            {
                 operation.Security.Add(securityRequirement);
            }
        }
    }
}