
using BjjWorld.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;

namespace BjjWorld.Application.Common.Services;

public sealed class LinkService(LinkGenerator linkGenerator, IHttpContextAccessor httpContextAccessor, ILogger<LinkService> logger) : ILinkService {
    private readonly LinkGenerator _linkGenerator = linkGenerator;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    private readonly ILogger<LinkService> _logger = logger;

    public (string? nextPageUrl, string? previousPageUrl) GeneratePaginationUrls(
          string controllerName,
          string actionName,
          int currentPage,
          int pageSize,
          int totalPages,
          bool hasNextPage,
          bool hasPreviousPage,
          RouteValueDictionary? additionalRouteValues = null) {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) {
            _logger.LogWarning("HttpContext is null. Cannot generate pagination URLs outside of a request context.");
            return (null, null);
        }

        var baseRouteValues = additionalRouteValues != null
            ? new RouteValueDictionary(additionalRouteValues)
            : [];

        if (!baseRouteValues.ContainsKey("pageSize")) {
            baseRouteValues["pageSize"] = pageSize;
        }
        // else // Optional: you could enforce the passed pageSize matches any existing one
        // {
        //    baseRouteValues["pageSize"] = pageSize; // Ensure correct value
        // }


        string? nextPageUrl = null;
        string? previousPageUrl = null;

        if (hasNextPage && currentPage < totalPages) {
            var nextRouteValues = new RouteValueDictionary(baseRouteValues) {
                ["page"] = currentPage + 1
            };
            nextPageUrl = GenerateAbsoluteUrl(httpContext, controllerName, actionName, nextRouteValues);
        }

        if (hasPreviousPage && currentPage > 1) {
            var prevRouteValues = new RouteValueDictionary(baseRouteValues) {
                ["page"] = currentPage - 1
            };
            previousPageUrl = GenerateAbsoluteUrl(httpContext, controllerName, actionName, prevRouteValues);
        }

        return (nextPageUrl, previousPageUrl);
    }

    private string? GenerateAbsoluteUrl(HttpContext httpContext, string controllerName, string actionName, RouteValueDictionary routeValues) {
        var uri = _linkGenerator.GetUriByAction(
            httpContext,
            action: actionName,
            controller: controllerName,
            values: routeValues
            // scheme: httpContext.Request.Scheme, // Scheme/Host usually inferred by GetUriByAction from context
            // host: httpContext.Request.Host
            );

        if (uri == null) {
            _logger.LogWarning("Link generation failed for Action: {Action}, Controller: {Controller}, RouteValues: {@RouteValues}",
                actionName, controllerName, routeValues);
        }

        return uri;
    }
}