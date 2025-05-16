using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BjjEire.Application.Common.Services;

public class UriService(IHttpContextAccessor httpContextAccessor, LinkGenerator linkGenerator) : IUriService
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
    private readonly LinkGenerator _linkGenerator = linkGenerator ?? throw new ArgumentNullException(nameof(linkGenerator));
    private HttpContext GetCurrentHttpContext() => _httpContextAccessor.HttpContext ?? throw new InvalidOperationException("HttpContext is not available. This service requires an active HTTP request context to generate absolute URIs.");

    public string GetPageUri(
        PaginationFilter filter,
        string controllerName,
        string actionName,
        IDictionary<string, object?>? additionalRouteValues = null)
    {
        ArgumentNullException.ThrowIfNull(filter, nameof(filter));
        ArgumentException.ThrowIfNullOrWhiteSpace(controllerName, nameof(controllerName));
        ArgumentException.ThrowIfNullOrWhiteSpace(actionName, nameof(actionName));

        var httpContext = GetCurrentHttpContext();

        var routeValues = new RouteValueDictionary
        {
            { "page", filter.PageNumber },
            { "pageSize", filter.PageSize }
        };

        if (additionalRouteValues != null)
        {
            foreach (var param in additionalRouteValues)
            {
                routeValues[param.Key] = param.Value;
            }
        }

        string? uriString = _linkGenerator.GetUriByAction(
            httpContext,
            action: actionName,
            controller: controllerName,
            values: routeValues);

        if (string.IsNullOrEmpty(uriString))
        {
            // It's helpful to log the parameters that failed if you have a logger here
            throw new InvalidOperationException($"Could not generate URI for Controller: '{controllerName}', Action: '{actionName}'. Ensure these names are correct, the route exists, and parameters match the action signature.");
        }

        return uriString;
    }
}