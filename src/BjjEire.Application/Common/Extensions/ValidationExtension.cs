
namespace BjjEire.Application.Common.Extensions;

public static class ValidationExtension {
    public static bool IsValidUrl(string? url) {
        return string.IsNullOrWhiteSpace(url) || (Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
               && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps));
    }
}