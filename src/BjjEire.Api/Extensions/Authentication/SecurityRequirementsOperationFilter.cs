
namespace BjjEire.Api.Extensions.Authentication;

public class SecurityRequirementsOperationFilter : IOperationFilter {
    public void Apply(OpenApiOperation operation, OperationFilterContext context) {
        ArgumentNullException.ThrowIfNull(operation);
        ArgumentNullException.ThrowIfNull(context);

        // Check for [AllowAnonymous] attribute
        var hasAllowAnonymous = context.MethodInfo.GetCustomAttributes(true)
            .OfType<AllowAnonymousAttribute>()
            .Any();

        if (hasAllowAnonymous) {
            operation.Security = []; // No security for AllowAnonymous
            return;
        }

        // Check for [Authorize] attribute
        var authorizeAttributes = context.MethodInfo.GetCustomAttributes(true)
            .OfType<AuthorizeAttribute>()
            .ToList();

        // Also check attributes on the controller
        authorizeAttributes.AddRange(context.MethodInfo.DeclaringType?.GetCustomAttributes(true)
            .OfType<AuthorizeAttribute>() ?? Enumerable.Empty<AuthorizeAttribute>());


        if (authorizeAttributes.Count > 0) {
            operation.Security ??= [];

            // Determine which schemes are applicable from the [Authorize] attributes
            // This is a simplified check. For complex policy-based auth, you might need more logic.
            bool usesJwt = false;
            bool usesApiKey = false;

            foreach (var attr in authorizeAttributes) {
                if (string.IsNullOrWhiteSpace(attr.AuthenticationSchemes)) {
                    usesJwt = true; 
                    usesApiKey = true;
                    break;
                }

                var schemes = attr.AuthenticationSchemes.Split(',')
                                  .Select(s => s.Trim())
                                  .ToList();

                if (schemes.Contains(JwtBearerDefaults.AuthenticationScheme)) {
                    usesJwt = true;
                }

                if (schemes.Contains(ApiKeyAuthenticationDefaults.AuthenticationScheme)) {
                    usesApiKey = true;
                }
            }

            // If no schemes were explicitly found but [Authorize] is present,
            // you might default to adding your primary scheme (e.g., JWT).
            if (!usesJwt && !usesApiKey && authorizeAttributes.Count > 0) {
                usesJwt = true; // Fallback for a plain [Authorize]
            }


            var securityRequirement = new OpenApiSecurityRequirement();

            if (usesJwt) {
                // Add JWT Bearer Authentication
                securityRequirement.Add(new OpenApiSecurityScheme {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "BearerAuth" },
                    // Scheme = "oauth2", // Not strictly necessary here if type is http/bearer
                    // Name = "Bearer", // Not strictly necessary here
                    // In = ParameterLocation.Header // Defined in AddSecurityDefinition
                }, []);
            }

            if (usesApiKey) {
                // Add API Key Authentication
                securityRequirement.Add(new OpenApiSecurityScheme {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "ApiKeyAuth" }
                }, []);
            }

            if (securityRequirement.Any()) {
                operation.Security.Add(securityRequirement);
            }
        }
    }
}
