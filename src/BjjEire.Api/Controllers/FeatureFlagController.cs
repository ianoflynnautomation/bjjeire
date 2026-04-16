using BjjEire.Api.Constants;

namespace BjjEire.Api.Controllers;

public class FeatureFlagController(IFeatureManager featureManager) : BaseApiController
{
    private readonly IFeatureManager _featureManager = featureManager;

    [EndpointDescription("Get all frontend feature flags")]
    [EndpointName("GetFeatureFlags")]
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(Dictionary<string, bool>))]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        Dictionary<string, bool> flags = new(capacity: FeatureFlags.FrontendFlags.Count);

        foreach (string name in FeatureFlags.FrontendFlags)
        {
            flags[name] = await _featureManager.IsEnabledAsync(name);
        }

        return Ok(flags);
    }
}
