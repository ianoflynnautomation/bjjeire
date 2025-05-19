using BjjEire.Infrastructure.Configuration;
using Microsoft.Extensions.Logging; // Add Microsoft.Extensions.Logging

namespace BjjEire.Api.Extensions.Authentication;

public class ApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory loggerFactory, // Add ILoggerFactory for Microsoft logging
    UrlEncoder encoder,
    IOptions<ApiKeyOptions> apiKeyOptions) : AuthenticationHandler<AuthenticationSchemeOptions>(options, loggerFactory, encoder)
{
    private readonly ApiKeyOptions _apiKeyOptions = apiKeyOptions.Value ?? throw new ArgumentNullException(nameof(apiKeyOptions), $"ApiKeyOptions cannot be null and its '{nameof(apiKeyOptions.Value)}' property cannot be null. Ensure it is configured.");
    private readonly ILogger<ApiKeyAuthenticationHandler> _logger = loggerFactory.CreateLogger<ApiKeyAuthenticationHandler>(); // Create Microsoft logger

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // This validation should ideally be caught at startup by ValidateApiKeyOptions
        if (string.IsNullOrWhiteSpace(_apiKeyOptions.HeaderName) || string.IsNullOrWhiteSpace(_apiKeyOptions.ApiKeyValue))
        {
            _logger.LogCritical("API Key authentication is critically misconfigured (HeaderName or ApiKeyValue is missing). This should have been validated at startup.");
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
        _logger.LogDebug("Challenge issued for API Key authentication scheme '{SchemeName}'. Responding with 401 Unauthorized.", Scheme.Name);
        Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    }

    protected override Task HandleForbiddenAsync(AuthenticationProperties properties)
    {
        _logger.LogDebug("Forbidden (403) issued for API Key authentication scheme '{SchemeName}'. The API key was valid but is not authorized for this resource.", Scheme.Name);
        Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.FromResult(Task.CompletedTask);
    }

    private static bool SecureCompare(string a, string b)
    {
        if (a == null || b == null)
        {
            return false;
        }

        int diff = a.Length ^ b.Length;
        for (int i = 0; i < a.Length && i < b.Length; i++)
        {
            diff |= a[i] ^ b[i];
        }
        return diff == 0;
    }
}