// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


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
