using BjjEire.Infrastructure.Configuration;
using BjjEire.SharedKernel.Logging;

namespace BjjEire.Api.Extensions.Authentication;

public static class AuthenticationExtensions {
    public static IServiceCollection AddAppAuthentication(this IServiceCollection services, IConfiguration configuration) {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var loggerFactory = services.BuildServiceProvider().GetService<ILoggerFactory>();
        var logger = loggerFactory?.CreateLogger(nameof(AuthenticationExtensions));

        var jwtOptionsSection = configuration.GetSection(JwtOptions.SectionName);
        if (!jwtOptionsSection.Exists()) {
            var ex = new InvalidOperationException($"Configuration section '{JwtOptions.SectionName}' not found. JWT authentication cannot be configured.");
            logger?.LogCritical(ApplicationLogEvents.Auth.ConfigSectionNotFound, ex, "Configuration section {ConfigSectionName} not found. JWT authentication cannot be configured.", JwtOptions.SectionName);
            throw ex;
        }
        _ = services.Configure<JwtOptions>(jwtOptionsSection);
        var jwtOptions = jwtOptionsSection.Get<JwtOptions>()!;
        ValidateJwtOptions(jwtOptions, logger);

        var apiKeyOptionsSection = configuration.GetSection(ApiKeyOptions.SectionName);
        if (!apiKeyOptionsSection.Exists()) {
            var ex = new InvalidOperationException($"Configuration section '{ApiKeyOptions.SectionName}' not found. API Key authentication cannot be configured.");
            logger?.LogCritical(ApplicationLogEvents.Auth.ConfigSectionNotFound, ex, "Configuration section {ConfigSectionName} not found. API Key authentication cannot be configured.", ApiKeyOptions.SectionName);
            throw ex;
        }
        _ = services.Configure<ApiKeyOptions>(apiKeyOptionsSection);
        var apiKeyOptions = apiKeyOptionsSection.Get<ApiKeyOptions>()!;
        ValidateApiKeyOptions(apiKeyOptions, logger);

        _ = services.AddAuthentication(options => {
            // No default scheme forces explicit scheme declaration on [Authorize] attributes or policies.
            // logger?.LogInformation("Authentication configured without a default scheme.");
        })
        .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, opt => {
            opt.TokenValidationParameters = new TokenValidationParameters {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidAudience = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
                ClockSkew = TimeSpan.FromSeconds(30)
            };

            opt.Events = new JwtBearerEvents {
                OnAuthenticationFailed = context => {
                    logger?.LogError(ApplicationLogEvents.Auth.JwtAuthFailed, context.Exception,
                        "JWT Authentication Failed. Path: {RequestPath}, Error: {ErrorMessage}",
                        context.Request.Path, context.Exception?.Message ?? "N/A");
                    return Task.CompletedTask;
                },
                OnTokenValidated = context => {
                    var userName = context.Principal?.Identity?.Name ?? "[UnknownUser]";
                    logger?.LogInformation(ApplicationLogEvents.Auth.JwtTokenValidated,
                        "JWT Token Validated for User: {UserName}, Path: {RequestPath}, Scheme: {AuthenticationScheme}",
                        userName, context.Request.Path, context.Scheme.Name);
                    return Task.CompletedTask;
                },
                OnChallenge = context => {
                    logger?.LogWarning(ApplicationLogEvents.Auth.JwtChallengeIssued,
                        "JWT Authentication Challenge for Path: {RequestPath}. Scheme: {AuthenticationScheme}. Client needs to authenticate or re-authenticate.",
                        context.Request.Path, context.Scheme.Name);
                    return Task.CompletedTask;
                }
            };
        })
        .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(
            ApiKeyAuthenticationDefaults.AuthenticationScheme,
            displayName: "API Key Authentication",
            configureOptions: options => { /* API Key specific options could be configured here if needed */ });

        logger?.LogInformation("Application authentication schemes (JWT Bearer, API Key) configured.");
        return services;
    }

    private static void ValidateJwtOptions(JwtOptions options, ILogger? logger) {
        var validationErrors = new List<string>();
        if (string.IsNullOrWhiteSpace(options.Issuer)) {
            validationErrors.Add($"{nameof(options.Issuer)} is missing.");
        }

        if (string.IsNullOrWhiteSpace(options.Audience)) {
            validationErrors.Add($"{nameof(options.Audience)} is missing.");
        }

        if (string.IsNullOrWhiteSpace(options.Key)) {
            validationErrors.Add($"{nameof(options.Key)} is missing.");
        }
        else if (Encoding.UTF8.GetBytes(options.Key).Length < 32 && !options.Key.StartsWith("GENERATED_DEBUG_KEY_")) {
            validationErrors.Add($"{nameof(options.Key)} must be at least 32 bytes (256 bits) and not a debug key in production.");
        }

        if (validationErrors.Any()) {
            var errorMessage = $"Invalid JWT configuration: {string.Join(" ", validationErrors)}";
            logger?.LogCritical(ApplicationLogEvents.Auth.OptionValidationFailed, errorMessage + " Source: JWT");
            throw new InvalidOperationException(errorMessage);
        }
    }

    private static void ValidateApiKeyOptions(ApiKeyOptions options, ILogger? logger) {
        var validationErrors = new List<string>();
        if (string.IsNullOrWhiteSpace(options.HeaderName)) {
            validationErrors.Add($"{nameof(options.HeaderName)} is missing.");
        }

        if (string.IsNullOrWhiteSpace(options.ApiKeyValue)) {
            validationErrors.Add($"{nameof(options.ApiKeyValue)} is missing.");
        }

        if (validationErrors.Any()) {
            var errorMessage = $"Invalid API Key configuration: {string.Join(" ", validationErrors)}";
            logger?.LogCritical(ApplicationLogEvents.Auth.OptionValidationFailed, errorMessage + " Source: APIKey");
            throw new InvalidOperationException(errorMessage);
        }
    }
}
