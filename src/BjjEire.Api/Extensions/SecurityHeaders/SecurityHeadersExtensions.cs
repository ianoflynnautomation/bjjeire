namespace BjjEire.Api.Extensions.SecurityHeaders;

public static class SecurityHeadersServiceCollectionExtensions
{
    public static IServiceCollection AddCustomSecurityHeaders(this IServiceCollection services)
    {
        _ = services.AddSecurityHeaderPolicies()
            .SetDefaultPolicy(policy =>
            {
                _ = policy.AddDefaultSecurityHeaders();

                // Override and add specific headers
                _ = policy.AddStrictTransportSecurity(maxAgeInSeconds: 60 * 60 * 24 * 365, includeSubdomains: true, preload: false);

                _ = policy.AddXssProtectionBlock();

                _ = policy.AddReferrerPolicyNoReferrer();

                _ = policy.AddPermissionsPolicy(builder =>
                {
                    _ = builder.AddAccelerometer().None();
                    _ = builder.AddCamera().None();
                    _ = builder.AddGeolocation().None();
                    _ = builder.AddGyroscope().None();
                    _ = builder.AddMagnetometer().None();
                    _ = builder.AddMicrophone().None();
                    _ = builder.AddPayment().None();
                    _ = builder.AddUsb().None();
                });

                // Build a strong Content-Security-Policy
                _ = policy.AddContentSecurityPolicy(builder =>
                {
                    _ = builder.AddObjectSrc().None();
                    _ = builder.AddFormAction().Self();
                    _ = builder.AddFrameAncestors().None();

                    _ = builder.AddDefaultSrc().Self();

                    // For a standard React/Vite app
                    _ = builder.AddScriptSrc().Self();
                    _ = builder.AddStyleSrc().Self();
                    _ = builder.AddImgSrc().Self().Data();
                    _ = builder.AddFontSrc().Self();
                    _ = builder.AddConnectSrc().Self();
                });
            });

        return services;
    }
}
