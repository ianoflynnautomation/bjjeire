// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;

namespace BjjEire.Core.Services;

/// <summary>
/// A test stub for <see cref="IUriService"/> that returns deterministic URIs without
/// requiring an active <see cref="Microsoft.AspNetCore.Http.HttpContext"/>.
/// </summary>
internal sealed class FakeUriService : IUriService
{
    public string GetPageUri(
        PaginationFilter filter,
        string controllerName,
        string actionName,
        IDictionary<string, object?>? additionalRouteValues = null) =>
        $"https://test-host/api/v1/{controllerName}?page={filter.PageNumber}&pageSize={filter.PageSize}";
}
