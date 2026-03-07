
using BjjEire.Application.Common.Models;

namespace BjjEire.Application.Common.Interfaces;

public interface IUriService
{
    public string GetPageUri(
           PaginationFilter filter,
           string controllerName,
           string actionName,
           IDictionary<string, object?>? additionalRouteValues = null
       );
}
