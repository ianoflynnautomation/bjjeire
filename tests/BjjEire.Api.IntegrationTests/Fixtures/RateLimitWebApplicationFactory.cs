// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;

namespace BjjEire.Api.IntegrationTests.Fixtures;

public class RateLimitWebApplicationFactory(string connectionString) : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"bjjeire_it_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder) {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.UseEnvironment("Development");

        _ = builder.ConfigureAppConfiguration((_, config) =>
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "ConnectionStrings:Mongodb", connectionString },
                { "RateLimitOptions:EnableRateLimiting", "true" },
                { "RateLimitOptions:PermitLimit", "2" },
                { "RateLimitOptions:WindowInSeconds", "10" },
                { "RateLimitOptions:RejectionStatusCode", "429" },
            }));

        _ = builder.ConfigureTestServices(services => {
            _ = services.RemoveTestServices();
            _ = services.AddTestDatabaseServices(_databaseName, connectionString);
            _ = services.AddApiTestServices();
        });
    }
}
