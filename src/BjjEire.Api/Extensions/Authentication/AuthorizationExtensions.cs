namespace BjjEire.Api.Extensions.Authentication;

public static class AuthorizationExtensions
{
    public const string RequireWriterPolicy = "RequireWriter";

    public static IServiceCollection AddAppAuthorization(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        _ = services.AddAuthorization(options =>
        {
            options.AddPolicy(RequireWriterPolicy, policy =>
                policy
                    .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
                    .RequireAuthenticatedUser());
        });

        return services;
    }
}
