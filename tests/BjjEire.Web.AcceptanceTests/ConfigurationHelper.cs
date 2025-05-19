using Microsoft.Extensions.Configuration;
using System;

namespace BjjEire.Web.AcceptanceTests;

internal static class ConfigurationHelper
{
    private static readonly IConfiguration Configuration = new ConfigurationBuilder()
        .AddJsonFile("appsettings.json")
        .AddEnvironmentVariables()
        .Build();

    private static Uri? s_baseUrl;

    public static Uri GetBaseUrl()
    {
        if (s_baseUrl == null)
        {
            var baseUrlString = Configuration["BaseUrl"]
                ?? throw new ArgumentNullException(null, "BaseUrl configuration is missing.");

            // Create Uri and trim trailing slashes
            if (!Uri.TryCreate(baseUrlString.TrimEnd('/'), UriKind.Absolute, out var uri))
            {
                throw new ArgumentException("BaseUrl is not a valid URI.");
            }

            s_baseUrl = uri;
        }

        return s_baseUrl;
    }
}