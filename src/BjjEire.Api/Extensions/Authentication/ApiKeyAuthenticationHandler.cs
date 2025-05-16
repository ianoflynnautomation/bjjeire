using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;
using BjjEire.Infrastructure.Configuration;

namespace BjjEire.Api.Extensions.Authentication;

public class ApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options, // IOptionsMonitor is good for options that might change
    ILoggerFactory loggerFactory, // Changed from ILogger to ILoggerFactory to create a specific logger
    UrlEncoder encoder,
    IOptions<ApiKeyOptions> apiKeyOptions) : AuthenticationHandler<AuthenticationSchemeOptions>(options, loggerFactory, encoder)
{
    private readonly ApiKeyOptions _apiKeyOptions = apiKeyOptions.Value ?? throw new ArgumentNullException(nameof(apiKeyOptions), $"ApiKeyOptions cannot be null and its '{nameof(apiKeyOptions.Value)}' property cannot be null. Ensure it is configured.");
    // Create a logger specific to this handler
    private readonly ILogger _logger = loggerFactory.CreateLogger<ApiKeyAuthenticationHandler>();


    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // This validation should ideally be caught at startup by ValidateApiKeyOptions
        if (string.IsNullOrWhiteSpace(_apiKeyOptions.HeaderName) || string.IsNullOrWhiteSpace(_apiKeyOptions.ApiKeyValue))
        {
            _logger.LogCritical("API Key authentication is critically misconfigured (HeaderName or ApiKeyValue is missing). This should have been validated at startup.");
            // This is a server configuration error, not a client error.
            return Task.FromResult(AuthenticateResult.Fail("API Key authentication is not configured properly on the server."));
        }

        if (!Request.Headers.TryGetValue(_apiKeyOptions.HeaderName, out var apiKeyHeaderValues))
        {
            _logger.LogDebug("API Key header '{HeaderName}' not found. Scheme '{SchemeName}' will not authenticate.", _apiKeyOptions.HeaderName, Scheme.Name);
            return Task.FromResult(AuthenticateResult.NoResult()); // Correct: No header, let other schemes try or allow anonymous.
        }

        var providedApiKey = apiKeyHeaderValues.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(providedApiKey))
        {
            _logger.LogWarning("API Key header '{HeaderName}' was present, but its value was empty or whitespace. Scheme: '{SchemeName}'.", _apiKeyOptions.HeaderName, Scheme.Name);
            return Task.FromResult(AuthenticateResult.Fail($"The value for API Key header '{_apiKeyOptions.HeaderName}' cannot be empty."));
        }

        if (SecureCompare(providedApiKey, _apiKeyOptions.ApiKeyValue))
        {
            var claims = new[] {
                new Claim(ClaimTypes.NameIdentifier, "ApiKeyUser", ClaimValueTypes.String, Scheme.Name),
                new Claim(ClaimTypes.Name, "ApiKeyService", ClaimValueTypes.String, Scheme.Name),
                new Claim("amr", "apikey", ClaimValueTypes.String, Scheme.Name) // Authentication Method Reference
            };
            var identity = new ClaimsIdentity(claims, Scheme.Name, ClaimTypes.Name, null); // Specify nameType and roleType if applicable
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);

            _logger.LogInformation("API Key authentication successful for scheme '{SchemeName}'.", Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }

        _logger.LogWarning("Invalid API Key provided for scheme '{SchemeName}'.", Scheme.Name);
        return Task.FromResult(AuthenticateResult.Fail("Invalid API Key."));
    }

    protected override Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        // This method is called when authentication is required but has failed or was not attempted.
        // For API Keys, a 401 is standard. Avoid WWW-Authenticate for API keys to not reveal auth mechanisms.
        Response.StatusCode = StatusCodes.Status401Unauthorized;
        _logger.LogDebug("Challenge issued for API Key authentication scheme '{SchemeName}'. Responding with 401 Unauthorized.", Scheme.Name);
        // Optionally, you could write a custom JSON response body if your API standard requires it.
        // Response.ContentType = "application/problem+json";
        // return Response.WriteAsJsonAsync(new { title = "Unauthorized", status = StatusCodes.Status401Unauthorized, detail = "Valid API Key required." });
        return Task.CompletedTask;
    }

    protected override Task HandleForbiddenAsync(AuthenticationProperties properties)
    {
        // This method is called when an authenticated user (via API Key in this case) is not authorized to access a resource.
        Response.StatusCode = StatusCodes.Status403Forbidden;
        _logger.LogDebug("Forbidden (403) issued for API Key authentication scheme '{SchemeName}'. The API key was valid but is not authorized for this resource.", Scheme.Name);
        // Response.ContentType = "application/problem+json";
        // return Response.WriteAsJsonAsync(new { title = "Forbidden", status = StatusCodes.Status403Forbidden, detail = "This API Key is not authorized for the requested action." });
        return Task.CompletedTask;
    }

    // Constant-time string comparison to help prevent timing attacks.
    private static bool SecureCompare(string a, string b)
    {
        // It's crucial that 'a' (provided key) and 'b' (configured key) are not null.
        // The null check for _apiKeyOptions.ApiKeyValue is done at the start of HandleAuthenticateAsync.
        // providedApiKey is checked for IsNullOrWhiteSpace.
        if (a == null || b == null) {
            return false; // Should not happen if checks above are done.
        }

        int diff = a.Length ^ b.Length;
        // Iterate up to the length of the shorter string if lengths are different,
        // or up to the full length if they are the same.
        // The initial diff (a.Length ^ b.Length) handles the length difference securely.
        for (int i = 0; i < a.Length && i < b.Length; i++)
        {
            diff |= a[i] ^ b[i];
        }
        return diff == 0;
    }
}