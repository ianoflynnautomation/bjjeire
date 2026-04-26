// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Competitions.DTOs;
using BjjEire.Application.Features.Competitions.Queries;

namespace BjjEire.Api.Controllers;

public class CompetitionController(IMediator mediator) : BaseApiController
{
    private readonly IMediator _mediator = mediator;

    [EndpointDescription("Get all competitions")]
    [EndpointName("GetAllCompetitions")]
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<CompetitionDto>))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAllAsync(
        [FromQuery] GetCompetitionPaginationQuery query,
        CancellationToken cancellationToken)
    {
        PagedResponse<CompetitionDto> response = await _mediator.Send(query, cancellationToken);

        return Ok(response);
    }
}
