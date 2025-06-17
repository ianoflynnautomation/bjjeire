using NetEscapades.AspNetCore.SecurityHeaders;

namespace BjjEire.Api.Extensions.SecurityHeaders;

public static class SecurityHeadersServiceCollectionExtensions {
    public static IServiceCollection AddCustomSecurityHeaders(this IServiceCollection services) {
        _ = services.AddSecurityHeaderPolicies()
            .SetDefaultPolicy(policy => {
                _ = policy.AddDefaultSecurityHeaders();

                // Override and add specific headers
                _ = policy.AddStrictTransportSecurity(maxAgeInSeconds: 60 * 60 * 24 * 365, includeSubdomains: true, preload: false);

                _ =  policy.AddXssProtectionBlock();

                _ = policy.AddReferrerPolicyNoReferrer();
                
                _ = policy.AddPermissionsPolicy(builder => {
                    builder.AddAccelerometer().None();
                    builder.AddCamera().None();
                    builder.AddGeolocation().None();
                    builder.AddGyroscope().None();
                    builder.AddMagnetometer().None();
                    builder.AddMicrophone().None();
                    builder.AddPayment().None();
                    builder.AddUsb().None();
                });

                // Build a strong Content-Security-Policy
                _ = policy.AddContentSecurityPolicy(builder => {
                    builder.AddObjectSrc().None();
                    builder.AddFormAction().Self();
                    builder.AddFrameAncestors().None();

                    builder.AddDefaultSrc().Self();

                    // For a standard React/Vite app
                    builder.AddScriptSrc().Self();
                    builder.AddStyleSrc().Self();
                    builder.AddImgSrc().Self().Data();
                    builder.AddFontSrc().Self();
                    builder.AddConnectSrc().Self();
                });
            });

        return services;
    }
}
