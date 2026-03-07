using BjjEire.Infrastructure.Configuration;

namespace BjjEire.Api.Extensions.Authentication;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddAppAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var jwtOptionsSection = configuration.GetSection(JwtOptions.SectionName);
        if (!jwtOptionsSection.Exists())
        {
            throw new InvalidOperationException($"Configuration section '{JwtOptions.SectionName}' not found. JWT authentication cannot be configured.");
        }

        _ = services.Configure<JwtOptions>(jwtOptionsSection);
        var jwtOptions = jwtOptionsSection.Get<JwtOptions>()!;
        ValidateJwtOptions(jwtOptions);

        var apiKeyOptionsSection = configuration.GetSection(ApiKeyOptions.SectionName);
        if (!apiKeyOptionsSection.Exists())
        {
            throw new InvalidOperationException($"Configuration section '{ApiKeyOptions.SectionName}' not found. API Key authentication cannot be configured.");
        }

        _ = services.Configure<ApiKeyOptions>(apiKeyOptionsSection);
        ValidateApiKeyOptions(apiKeyOptionsSection.Get<ApiKeyOptions>()!);

        _ = services.AddAuthentication()
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, opt =>
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
                })
            .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(
                ApiKeyAuthenticationDefaults.AuthenticationScheme,
                displayName: "API Key Authentication",
                configureOptions: _ => { });

        return services;
    }

    private static void ValidateJwtOptions(JwtOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(options.Issuer))
        { errors.Add($"{nameof(options.Issuer)} is missing."); }
        if (string.IsNullOrWhiteSpace(options.Audience))
        { errors.Add($"{nameof(options.Audience)} is missing."); }
        if (string.IsNullOrWhiteSpace(options.Key))
        {
            errors.Add($"{nameof(options.Key)} is missing.");
        }
        else if (Encoding.UTF8.GetBytes(options.Key).Length < 32 && !options.Key.StartsWith("GENERATED_DEBUG_KEY_", StringComparison.Ordinal))
        {
            errors.Add($"{nameof(options.Key)} must be at least 32 bytes (256 bits) and not a debug key in production.");
        }

        if (errors.Count > 0)
        {
            throw new InvalidOperationException($"Invalid JWT configuration: {string.Join(" ", errors)}");
        }
    }

    private static void ValidateApiKeyOptions(ApiKeyOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(options.HeaderName))
        { errors.Add($"{nameof(options.HeaderName)} is missing."); }
        if (string.IsNullOrWhiteSpace(options.ApiKeyValue))
        { errors.Add($"{nameof(options.ApiKeyValue)} is missing."); }

        if (errors.Count > 0)
        {
            throw new InvalidOperationException($"Invalid API Key configuration: {string.Join(" ", errors)}");
        }
    }
}
