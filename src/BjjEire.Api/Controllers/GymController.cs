// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Api.Extensions.Authentication;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Gyms.Commands;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Application.Features.Gyms.Queries;

namespace BjjEire.Api.Controllers;

public class GymController(IMediator mediator) : BaseApiController
{
    private readonly IMediator _mediator = mediator;

    [EndpointDescription("Get all gyms")]
    [EndpointName("GetAllGyms")]
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<GymDto>))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAllAsync(
        [FromQuery] GetGymPaginationQuery query,
        CancellationToken cancellationToken)
    {
        PagedResponse<GymDto> response = await _mediator.Send(query, cancellationToken);

        return Ok(response);
    }

    [EndpointDescription("Get a gym by id")]
    [EndpointName("GetGymById")]
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GymDto))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdAsync(
        [FromRoute] string id,
        CancellationToken cancellationToken)
    {
        GetGymByIdQuery query = new() { Id = id };

        GymDto? response = await _mediator.Send(query, cancellationToken);

        return response is null ? NotFound() : Ok(response);
    }

    [EndpointDescription("Create a gym")]
    [EndpointName("InsertGym")]
    [HttpPost]
    [Authorize(Policy = AuthorizationExtensions.RequireWriterPolicy)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(CreateGymResponse))]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostAsync(
        [FromBody] CreateGymCommand command,
        CancellationToken cancellationToken)
    {
        CreateGymResponse response = await _mediator.Send(command, cancellationToken);

        string? location = Url.Action(nameof(GetByIdAsync), new { id = response.Data.Id });
        return Created(location ?? string.Empty, response);
    }

    [EndpointDescription("Update a gym")]
    [EndpointName("UpdateGym")]
    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationExtensions.RequireWriterPolicy)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UpdateGymResponse))]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PutAsync(
        [FromRoute] string id,
        [FromBody] UpdateGymCommand command,
        CancellationToken cancellationToken)
    {
        UpdateGymResponse response = await _mediator.Send(command, cancellationToken);

        return Ok(response);
    }

    [EndpointDescription("Delete a gym")]
    [EndpointName("DeleteGym")]
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
        DeleteGymCommand command = new() { Id = id };

        _ = await _mediator.Send(command, cancellationToken);

        return NoContent();
    }
}
