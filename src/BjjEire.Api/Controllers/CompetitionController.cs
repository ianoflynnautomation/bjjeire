using BjjEire.Application.Features.Competitions.Queries;

namespace BjjEire.Api.Controllers;

public class CompetitionController(IMediator mediator) : BaseApiController
{
    private readonly IMediator _mediator = mediator;

    [EndpointDescription("Get Competition entities")]
    [EndpointName("GetAllCompetitions")]
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GetCompetitionPaginatedResponse))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAllAsync([FromQuery] GetCompetitionPaginationQuery query)
    {
        GetCompetitionPaginatedResponse response = await _mediator.Send(query);

        return Ok(response);
    }
}
