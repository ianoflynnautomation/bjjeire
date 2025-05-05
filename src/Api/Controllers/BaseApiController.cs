

using BjjWorld.Api.Constants;

namespace BjjWorld.Api.Controllers;

    [Route($"{ConfigurationsConstants.RestRoutePrefix}/[controller]")]
    [ApiExplorerSettings(IgnoreApi = false, GroupName = "v1")]
    [Produces("application/json")]
    [ApiController]
    public abstract class BaseApiController : ControllerBase
    {
    }

