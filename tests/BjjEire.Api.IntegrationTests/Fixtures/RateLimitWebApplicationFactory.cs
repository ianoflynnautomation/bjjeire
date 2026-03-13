// Copyright (c) {year} BjjWorld. All rights reserved.
// Licensed under the MIT License.


using BjjEire.Core;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace BjjEire.Api.IntegrationTests.Fixtures;

public class RateLimitWebApplicationFactory(string connectionString) : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"bjjeire_it_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.UseEnvironment("Test");

        _ = builder.ConfigureCustomLogging();

        _ = builder.ConfigureAppConfiguration((_, config) =>
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "ConnectionStrings:Mongodb", connectionString },
                { "RateLimitOptions:EnableRateLimiting", "true" },
                { "RateLimitOptions:PermitLimit", "2" },
                { "RateLimitOptions:WindowInSeconds", "5" },
                { "RateLimitOptions:RejectionStatusCode", "429" },
            }));

        _ = builder.ConfigureTestServices(services =>
        {
            _ = services.RemoveTestServices();
            _ = services.AddTestDatabaseServices(_databaseName, connectionString);
            _ = services.AddApiTestServices();

            // Strip all Microsoft.Identity.Web JwtBearer options (including ConfigurationManager
            // that would try to fetch JWKS from Entra at test time) and replace with a plain
            // symmetric-key setup backed by TestTokenFactory.
            services.RemoveAll<IConfigureOptions<JwtBearerOptions>>();
            services.RemoveAll<IPostConfigureOptions<JwtBearerOptions>>();

            services.Configure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = TestTokenFactory.SigningKey,
                    ValidIssuer = TestTokenFactory.TestIssuer,
                    ValidAudience = TestTokenFactory.TestAudience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
            });
        });
    }
}
