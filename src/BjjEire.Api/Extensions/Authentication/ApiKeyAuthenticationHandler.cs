// Copyright (c) BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Infrastructure.Configuration;
using BjjEire.SharedKernel.Logging;

namespace BjjEire.Api.Extensions.Authentication;

public class ApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory loggerFactory,
    UrlEncoder encoder,
    IOptions<ApiKeyOptions> apiKeyOptions)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, loggerFactory, encoder) {
    private readonly ApiKeyOptions _apiKeyOptions = apiKeyOptions.Value ?? throw new ArgumentNullException(nameof(apiKeyOptions), $"ApiKeyOptions cannot be null and its '{nameof(apiKeyOptions.Value)}' property cannot be null. Ensure it is configured.");
    private readonly ILogger<ApiKeyAuthenticationHandler> _logger = loggerFactory.CreateLogger<ApiKeyAuthenticationHandler>();

    protected override Task<AuthenticateResult> HandleAuthenticateAsync() {
        var traceId = Context.TraceIdentifier;
        var clientIp = Context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        if (string.IsNullOrWhiteSpace(_apiKeyOptions.HeaderName) || string.IsNullOrWhiteSpace(_apiKeyOptions.ApiKeyValue)) {
            _logger.LogCritical(ApplicationLogEvents.ApiKey.AuthMisconfigured,
                "API Key authentication is critically misconfigured (HeaderName or ApiKeyValue is missing). This should have been validated at startup. TraceId: {TraceId}",
                traceId);
            return Task.FromResult(AuthenticateResult.Fail("API Key authentication is not configured properly on the server."));
        }

        if (!Request.Headers.TryGetValue(_apiKeyOptions.HeaderName, out var apiKeyHeaderValues)) {
            _logger.LogDebug(ApplicationLogEvents.ApiKey.HeaderNotFound,
                "API Key header '{ApiKeyHeaderName}' not found. Scheme '{AuthenticationSchemeName}' will not authenticate. TraceId: {TraceId}, ClientIP: {ClientIP}",
                _apiKeyOptions.HeaderName, Scheme.Name, traceId, clientIp);
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var providedApiKey = apiKeyHeaderValues.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(providedApiKey)) {
            _logger.LogWarning(ApplicationLogEvents.ApiKey.HeaderEmpty,
                "API Key header '{ApiKeyHeaderName}' was present, but its value was empty or whitespace. Scheme: '{AuthenticationSchemeName}'. TraceId: {TraceId}, ClientIP: {ClientIP}",
                _apiKeyOptions.HeaderName, Scheme.Name, traceId, clientIp);
            return Task.FromResult(AuthenticateResult.Fail($"The value for API Key header '{_apiKeyOptions.HeaderName}' cannot be empty."));
        }

        if (SecureCompare(providedApiKey, _apiKeyOptions.ApiKeyValue)) {
            var principalName = "ApiKeyService";
            var claims = new[] {
                new Claim(ClaimTypes.NameIdentifier, "ApiKeyUser", ClaimValueTypes.String, Scheme.Name),
                new Claim(ClaimTypes.Name, principalName, ClaimValueTypes.String, Scheme.Name),
                new Claim("amr", "apikey", ClaimValueTypes.String, Scheme.Name)
            };
            var identity = new ClaimsIdentity(claims, Scheme.Name, ClaimTypes.Name, null);
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);

            _logger.LogInformation(ApplicationLogEvents.ApiKey.AuthSuccess,
                "API Key authentication successful for Scheme '{AuthenticationSchemeName}'. PrincipalName: '{PrincipalName}'. TraceId: {TraceId}, ClientIP: {ClientIP}",
                Scheme.Name, principalName, traceId, clientIp);
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }

        _logger.LogWarning(ApplicationLogEvents.ApiKey.AuthInvalid,
            "Invalid API Key provided for Scheme '{AuthenticationSchemeName}'. TraceId: {TraceId}, ClientIP: {ClientIP}",
            Scheme.Name, traceId, clientIp);
        return Task.FromResult(AuthenticateResult.Fail("Invalid API Key."));
    }

    protected override Task HandleChallengeAsync(AuthenticationProperties properties) {
        _logger.LogDebug(ApplicationLogEvents.ApiKey.ChallengeIssued,
            "Challenge issued for API Key authentication Scheme '{AuthenticationSchemeName}'. Responding with 401 Unauthorized. TraceId: {TraceId}",
            Scheme.Name, Context.TraceIdentifier);
        Response.StatusCode = StatusCodes.Status401Unauthorized;
        // Consider adding WWW-Authenticate header if appropriate for API key scheme.
        // Response.Headers.Append("WWW-Authenticate", $"ApiKey realm=\"{Options.Realm}\"");
        return Task.CompletedTask;
    }

    protected override Task HandleForbiddenAsync(AuthenticationProperties properties) {
        _logger.LogDebug(ApplicationLogEvents.ApiKey.ForbiddenIssued,
            "Forbidden (403) issued for API Key authentication Scheme '{AuthenticationSchemeName}'. API key was valid but not authorized. TraceId: {TraceId}",
            Scheme.Name, Context.TraceIdentifier);
        Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    }

    private static bool SecureCompare(string a, string b) {
        if (a == null || b == null) {
            return false;
        }

        int diff = a.Length ^ b.Length;
        for (int i = 0; i < a.Length && i < b.Length; i++) {
            diff |= a[i] ^ b[i];
        }
        return diff == 0;
    }
}
