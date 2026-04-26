// Copyright (c) BjjEire. All rights reserved.
// Licensed under the MIT License.

using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Stores.DTOs;
using BjjEire.Application.Features.Stores.Queries;

namespace BjjEire.Api.Controllers;

public class StoreController(IMediator mediator) : BaseApiController
{
    private readonly IMediator _mediator = mediator;

    [EndpointDescription("Get all stores")]
    [EndpointName("GetAllStores")]
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<StoreDto>))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAllAsync(
        [FromQuery] GetStorePaginationQuery query,
        CancellationToken cancellationToken)
    {
        PagedResponse<StoreDto> response = await _mediator.Send(query, cancellationToken);

        return Ok(response);
    }
}
