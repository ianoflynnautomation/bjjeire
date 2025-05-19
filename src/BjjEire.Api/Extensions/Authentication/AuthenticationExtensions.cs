using BjjEire.Infrastructure.Configuration;
using Microsoft.Extensions.Logging; // Add Microsoft.Extensions.Logging
using System.Text; // For Encoding.UTF8

namespace BjjEire.Api.Extensions.Authentication;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddAppAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        // Create logger using ILoggerFactory
        var logger = services.BuildServiceProvider().GetService<ILoggerFactory>()?.CreateLogger(nameof(AuthenticationExtensions));

        // Configure and validate JWT Options
        var jwtOptionsSection = configuration.GetSection(JwtOptions.SectionName);
        if (!jwtOptionsSection.Exists())
        {
            var ex = new InvalidOperationException($"Configuration section '{JwtOptions.SectionName}' not found. JWT authentication cannot be configured.");
            logger?.LogCritical(ex, ex.Message);
            throw ex;
        }
        _ = services.Configure<JwtOptions>(jwtOptionsSection);
        var jwtOptions = jwtOptionsSection.Get<JwtOptions>()!;
        ValidateJwtOptions(jwtOptions, logger);

        // Configure and validate API Key Options
        var apiKeyOptionsSection = configuration.GetSection(ApiKeyOptions.SectionName);
        if (!apiKeyOptionsSection.Exists())
        {
            var ex = new InvalidOperationException($"Configuration section '{ApiKeyOptions.SectionName}' not found. API Key authentication cannot be configured.");
            logger?.LogCritical(ex, ex.Message);
            throw ex;
        }
        _ = services.Configure<ApiKeyOptions>(apiKeyOptionsSection);
        var apiKeyOptions = apiKeyOptionsSection.Get<ApiKeyOptions>()!;
        ValidateApiKeyOptions(apiKeyOptions, logger);

        _ = services.AddAuthentication(options =>
        {
            // No default scheme: Forces explicit scheme declaration on [Authorize] attributes
        })
        .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, opt =>
        {
            opt.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidAudience = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
                ClockSkew = TimeSpan.FromSeconds(30)
            };

            opt.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    logger?.LogError(context.Exception, "JWT Authentication Failed. Path: {Path}", context.Request.Path);
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    logger?.LogInformation("JWT Token Validated for user: {User}, Path: {Path}", context.Principal?.Identity?.Name, context.Request.Path);
                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    logger?.LogWarning("JWT Authentication Challenge for path: {Path}. Client may need to authenticate.", context.Request.Path);
                    return Task.CompletedTask;
                }
            };
        })
        .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(
            ApiKeyAuthenticationDefaults.AuthenticationScheme,
            displayName: "API Key Authentication",
            configureOptions: options => { });

        return services;
    }

    private static void ValidateJwtOptions(JwtOptions options, ILogger? logger) // Use Microsoft.Extensions.Logging.ILogger
    {
        var validationErrors = new List<string>();
        if (string.IsNullOrWhiteSpace(options.Issuer))
        {
            validationErrors.Add($"JWT {nameof(options.Issuer)} cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(options.Audience))
        {
            validationErrors.Add($"JWT {nameof(options.Audience)} cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(options.Key))
        {
            validationErrors.Add($"JWT {nameof(options.Key)} cannot be empty.");
        }
        else if (Encoding.UTF8.GetBytes(options.Key).Length < 32 && !options.Key.StartsWith("GENERATED_DEBUG_KEY_"))
        {
            validationErrors.Add($"JWT {nameof(options.Key)} should be at least 32 bytes (256 bits) for HS256 security and not be a debug key in production.");
        }

        if (validationErrors.Any())
        {
            var errorMessage = $"Invalid JWT configuration: {string.Join(" ", validationErrors)}";
            logger?.LogCritical(errorMessage);
            throw new InvalidOperationException(errorMessage);
        }
    }

    private static void ValidateApiKeyOptions(ApiKeyOptions options, ILogger? logger) // Use Microsoft.Extensions.Logging.ILogger
    {
        var validationErrors = new List<string>();
        if (string.IsNullOrWhiteSpace(options.HeaderName))
        {
            validationErrors.Add($"API Key {nameof(options.HeaderName)} cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(options.ApiKeyValue))
        {
            validationErrors.Add($"API Key {nameof(options.ApiKeyValue)} cannot be empty. Ensure it is set in configuration (e.g., user secrets, environment variables).");
        }

        if (validationErrors.Any())
        {
            var errorMessage = $"Invalid API Key configuration: {string.Join(" ", validationErrors)}";
            logger?.LogCritical(errorMessage);
            throw new InvalidOperationException(errorMessage);
        }
    }
}