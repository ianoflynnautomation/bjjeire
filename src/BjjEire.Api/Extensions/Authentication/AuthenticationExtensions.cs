using BjjEire.Infrastructure.Configuration;
using Microsoft.Identity.Web;

namespace BjjEire.Api.Extensions.Authentication;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddAppAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var azureAdSection = configuration.GetSection(AzureAdOptions.SectionName);
        if (!azureAdSection.Exists())
        {
            throw new InvalidOperationException($"Configuration section '{AzureAdOptions.SectionName}' not found. Entra ID authentication cannot be configured.");
        }

        _ = services.Configure<AzureAdOptions>(azureAdSection);
        ValidateAzureAdOptions(azureAdSection.Get<AzureAdOptions>()!);

        _ = services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddMicrosoftIdentityWebApi(configuration, AzureAdOptions.SectionName, JwtBearerDefaults.AuthenticationScheme);

        return services;
    }

    private static void ValidateAzureAdOptions(AzureAdOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(options.TenantId))
        { errors.Add($"{nameof(options.TenantId)} is missing."); }
        if (string.IsNullOrWhiteSpace(options.ClientId))
        { errors.Add($"{nameof(options.ClientId)} is missing."); }

        if (errors.Count > 0)
        {
            throw new InvalidOperationException($"Invalid AzureAd configuration: {string.Join(" ", errors)}");
        }
    }
}
