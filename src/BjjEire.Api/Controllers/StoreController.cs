using BjjEire.Application.Features.Stores.Queries;

namespace BjjEire.Api.Controllers;

public class StoreController(IMediator mediator) : BaseApiController
{
    private readonly IMediator _mediator = mediator;

    [EndpointDescription("Get Store entities")]
    [EndpointName("GetAllStores")]
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GetStorePaginatedResponse))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAllAsync([FromQuery] GetStorePaginationQuery query)
    {
        GetStorePaginatedResponse response = await _mediator.Send(query);

        return Ok(response);
    }
}
