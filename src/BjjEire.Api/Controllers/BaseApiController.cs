// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.


using BjjEire.Api.Constants;

namespace BjjEire.Api.Controllers;

[Route($"{ConfigurationsConstants.RestRoutePrefix}/[controller]")]
[ApiExplorerSettings(IgnoreApi = false, GroupName = "v1")]
[Produces("application/json")]
[ApiController]
public abstract class BaseApiController : ControllerBase;
