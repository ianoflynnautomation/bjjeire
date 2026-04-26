// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using Asp.Versioning;

using BjjEire.SharedKernel.Extensions;

namespace BjjEire.Api.Controllers;

[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion(ApiConstants.ApiVersionV1Major)]
[ApiExplorerSettings(IgnoreApi = false, GroupName = ApiConstants.ApiGroupNameV1)]
[Produces("application/json")]
[ApiController]
public abstract class BaseApiController : ControllerBase;
