using BjjEire.Api.Extensions.Authentication;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.Queries;

namespace BjjEire.Api.Controllers;

public class BjjEventController(IMediator mediator) : BaseApiController {
    private readonly IMediator _mediator = mediator;

    [EndpointDescription("Get Bjj Event entitys")]
    [EndpointName("GetAllBjjEvents")]
    [HttpGet()]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GetBjjEventPaginatedResponse))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAllAsync([FromQuery] GetBjjEventPaginationQuery query) {
        var response = await _mediator.Send(query);

        return Ok(response);
    }

    [EndpointDescription("Add new entity to Bjj Event")]
    [EndpointName("InsertBjjEvent")]
    [HttpPost]
    [Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},{ApiKeyAuthenticationDefaults.AuthenticationScheme}")]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(CreateBjjEventResponse))]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)] 
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostAsync([FromBody] CreateBjjEventCommand command) {
        var response = await _mediator.Send(command);

        return Created(string.Empty, response);
    }

    [EndpointDescription("Update entity in Bjj Event")]
    [EndpointName("UpdateBjjEvent")]
    [HttpPut]
    [Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},{ApiKeyAuthenticationDefaults.AuthenticationScheme}")]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UpdateBjjEventResponse))]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)] 
    public async Task<IActionResult> PutAsync([FromBody] UpdateBjjEventCommand command) {
        var response = await _mediator.Send(command);

        return Ok(response);
    }

    [EndpointDescription("Delete entity in Bjj Event")]
    [EndpointName("DeleteBjjEvent")]
    [HttpDelete("{id}")]
    [Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},{ApiKeyAuthenticationDefaults.AuthenticationScheme}")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)] 
    public async Task<IActionResult> DeleteAsync([FromRoute] string id) {

        if (string.IsNullOrWhiteSpace(id)) {
            return BadRequest();
        }
        var command = new DeleteBjjEventCommand { Id = id };

        _ = await _mediator.Send(command);

        return NoContent();
    }
}

