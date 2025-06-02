
using BjjEire.Api.Extensions.Authentication;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Application.Features.BjjEvents.Queries;

namespace BjjEire.Api.Controllers;

public class BjjEventController(IMediator mediator) : BaseApiController
{
  private readonly IMediator _mediator = mediator;

  [EndpointDescription("Get Bjj Event entitys")]
  [EndpointName("GetAllBjjEvents")]
  [HttpGet()]
  [AllowAnonymous]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GetBjjEventPaginatedResponse))]
  [ProducesResponseType(StatusCodes.Status403Forbidden)]
  [ProducesResponseType(StatusCodes.Status404NotFound)]
  public async Task<IActionResult> GetAll([FromQuery] GetBjjEventPaginationQuery query)
  {
    var response = await _mediator.Send(query);

    return Ok(response);
  }

  [EndpointDescription("Add new entity to Bjj Event")]
  [EndpointName("InsertBjjEvent")]
  [HttpPost]
  [Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},{ApiKeyAuthenticationDefaults.AuthenticationScheme}")]
  [ProducesResponseType(StatusCodes.Status403Forbidden)]
  [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(CreateBjjEventResponse))]
  [ProducesResponseType(StatusCodes.Status400BadRequest)]
  public async Task<IActionResult> Post([FromBody] CreateBjjEventCommand command)
  {
    var response = await _mediator.Send(command);

    return Created(string.Empty, response);

    //return Created(string.Empty, response.Data!.Id);
  }

  [EndpointDescription("Update entity in Bjj Event")]
  [EndpointName("UpdateBjjEvent")]
  [HttpPut]
  [Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},{ApiKeyAuthenticationDefaults.AuthenticationScheme}")]
  [ProducesResponseType(StatusCodes.Status403Forbidden)]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UpdateBjjEventResponse))]
  [ProducesResponseType(StatusCodes.Status400BadRequest)]
  public async Task<IActionResult> Put([FromBody] UpdateBjjEventCommand command)
  {
    var response = await _mediator.Send(command);

    return Ok(response);
  }

  [EndpointDescription("Delete entity in Bjj Event")]
  [EndpointName("DeleteBjjEvent")]
  [HttpDelete("{id}")]
  [Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},{ApiKeyAuthenticationDefaults.AuthenticationScheme}")]
  [ProducesResponseType(StatusCodes.Status204NoContent, Type = typeof(DeleteBjjEventResponse))]
  [ProducesResponseType(StatusCodes.Status403Forbidden)]
  [ProducesResponseType(StatusCodes.Status404NotFound)]
  public async Task<NoContent> Delete([FromRoute] DeleteBjjEventCommand command)
  {
    _ = await _mediator.Send(command);

    return TypedResults.NoContent();
  }
}

