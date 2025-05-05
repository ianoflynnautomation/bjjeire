using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace BjjWorld.Api.Controllers;

public class HealthCheckController(HealthCheckService healthCheckService) : BaseApiController
{
    private readonly HealthCheckService _healthCheckService = healthCheckService;


    [EndpointDescription("Provides detailed health check")]
    [EndpointName("HealthCheck")]
    [HttpGet]
    //[AllowAnonymous] // Keep commented or uncomment based on your security needs
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetHealth()
    {
        var report = await _healthCheckService.CheckHealthAsync();

        var response = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                description = entry.Value.Description,
                duration = entry.Value.Duration
            }),
            duration = report.TotalDuration
        };

        if (report.Status == HealthStatus.Healthy || report.Status == HealthStatus.Degraded)
        {
            return Ok(response);
        }

        return StatusCode(StatusCodes.Status503ServiceUnavailable, response);
    }
}
