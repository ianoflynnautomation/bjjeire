using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BjjEire.Application.Common.Services;

public class UriService(IHttpContextAccessor httpContextAccessor, LinkGenerator linkGenerator) : IUriService
{
    private HttpContext GetCurrentHttpContext() =>
        httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("HttpContext is not available. This service requires an active HTTP request context to generate absolute URIs.");

    public string GetPageUri(
        PaginationFilter filter,
        string controllerName,
        string actionName,
        IDictionary<string, object?>? additionalRouteValues = null)
    {
        ArgumentNullException.ThrowIfNull(filter);
        ArgumentException.ThrowIfNullOrWhiteSpace(controllerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(actionName);

        var httpContext = GetCurrentHttpContext();

        var routeValues = new RouteValueDictionary {
            { "page", filter.PageNumber },
            { "pageSize", filter.PageSize }
        };

        if (additionalRouteValues != null)
        {
            foreach (var (key, value) in additionalRouteValues)
            {
                routeValues[key] = value;
            }
        }

        return linkGenerator.GetUriByAction(httpContext, action: actionName, controller: controllerName, values: routeValues)
            ?? throw new InvalidOperationException($"Could not generate URI for Controller: '{controllerName}', Action: '{actionName}'. Ensure these names are correct, the route exists, and parameters match the action signature.");
    }
}
