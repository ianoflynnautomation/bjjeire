// Copyright (c) [InvalidReference] BjjWorld. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.IntegrationTests.Extensions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;

namespace BjjEire.Api.IntegrationTests.Fixtures;

public class CustomWebApplicationFactory(string connectionString) : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"bjjeire_it_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        _ = builder.UseEnvironment("Development");

        _ = builder.ConfigureCustomLogging();

        _ = builder.ConfigureAppConfiguration((_, config) =>
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "ConnectionStrings:Mongodb", connectionString },
                { "RateLimitOptions:EnableRateLimiting", "false" }
            }));

        _ = builder.ConfigureTestServices(services =>
        {
            _ = services.RemoveTestServices();
            _ = services.RemoveTestCacheServices();
            _ = services.AddTestDatabaseServices(_databaseName, connectionString);
            _ = services.AddTestCacheServices();
            _ = services.AddApiTestServices();

        });
    }
}
