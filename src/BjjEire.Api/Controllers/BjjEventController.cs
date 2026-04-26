// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.Extensions.Authentication;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Application.Features.BjjEvents.Queries;

namespace BjjEire.Api.Controllers;

public class BjjEventController(IMediator mediator) : BaseApiController
{
    private readonly IMediator _mediator = mediator;

    [EndpointDescription("Get all BJJ events. Only active events are returned by default; pass ?includeInactive=true to include deactivated/expired events.")]
    [EndpointName("GetAllBjjEvents")]
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<BjjEventDto>))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAllAsync(
        [FromQuery] GetBjjEventPaginationQuery query,
        CancellationToken cancellationToken)
    {
        PagedResponse<BjjEventDto> response = await _mediator.Send(query, cancellationToken);

        return Ok(response);
    }

    [EndpointDescription("Get a BJJ event by id")]
    [EndpointName("GetBjjEventById")]
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(BjjEventDto))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdAsync(
        [FromRoute] string id,
        CancellationToken cancellationToken)
    {
        GetBjjEventByIdQuery query = new() { Id = id };

        BjjEventDto? response = await _mediator.Send(query, cancellationToken);

        return response is null ? NotFound() : Ok(response);
    }

    [EndpointDescription("Create a BJJ event")]
    [EndpointName("InsertBjjEvent")]
    [HttpPost]
    [Authorize(Policy = AuthorizationExtensions.RequireWriterPolicy)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(CreateBjjEventResponse))]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostAsync(
        [FromBody] CreateBjjEventCommand command,
        CancellationToken cancellationToken)
    {
        CreateBjjEventResponse response = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(nameof(GetByIdAsync), new { id = response.Data.Id }, response);
    }

    [EndpointDescription("Update a BJJ event")]
    [EndpointName("UpdateBjjEvent")]
    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationExtensions.RequireWriterPolicy)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UpdateBjjEventResponse))]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PutAsync(
        [FromRoute] string id,
        [FromBody] UpdateBjjEventCommand command,
        CancellationToken cancellationToken)
    {
        UpdateBjjEventResponse response = await _mediator.Send(command, cancellationToken);

        return Ok(response);
    }

    [EndpointDescription("Delete a BJJ event")]
    [EndpointName("DeleteBjjEvent")]
    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationExtensions.RequireWriterPolicy)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteAsync(
        [FromRoute] string id,
        CancellationToken cancellationToken)
    {
        DeleteBjjEventCommand command = new() { Id = id };

        _ = await _mediator.Send(command, cancellationToken);

        return NoContent();
    }
}
