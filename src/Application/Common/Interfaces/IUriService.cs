
using Microsoft.AspNetCore.Routing;

namespace BjjWorld.Application.Common.Interfaces;

public interface ILinkService {
    public (string? nextPageUrl, string? previousPageUrl) GeneratePaginationUrls(
        string controllerName,
        string actionName,
        int currentPage,
        int pageSize,
        int totalPages,
        bool hasNextPage,
        bool hasPreviousPage,
        RouteValueDictionary? additionalRouteValues = null);
}