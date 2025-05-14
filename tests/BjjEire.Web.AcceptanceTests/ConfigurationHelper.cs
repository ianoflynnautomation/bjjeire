using Microsoft.Extensions.Configuration;

namespace BjjEire.Web.AcceptanceTests;

public static class ConfigurationHelper
{
    private static readonly IConfiguration Configuration;

    static ConfigurationHelper()
    {
        Configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .AddEnvironmentVariables()
            .Build();
    }

    private static string? s_baseUrl;

    public static string GetBaseUrl()
    {
        if (s_baseUrl == null)
        {
            s_baseUrl = Configuration["BaseUrl"];

            ArgumentNullException.ThrowIfNull(s_baseUrl);

            s_baseUrl = s_baseUrl.TrimEnd('/');
        }

        return s_baseUrl;
    }
}
