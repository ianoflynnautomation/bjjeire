using BjjEire.Api.Extensions.Authentication;
using BjjEire.Application.Features.Gyms.Commands;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Application.Features.Gyms.Queries;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;

namespace BjjEire.Api.Controllers;

public class GymController(IMediator mediator) : BaseApiController {
    private readonly IMediator _mediator = mediator;

    [EndpointDescription("Get Gym entitys")]
    [EndpointName("GetAllGyms")]
    [HttpGet()]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GetGymPaginatedResponse))]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAll([FromQuery] GetGymPaginationQuery query) {
        var response = await _mediator.Send(query);

        return Ok(response);
    }

    [EndpointDescription("Add new entity to Gym")]
    [EndpointName("InsertGym")]
    [HttpPost]
    [Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},{ApiKeyAuthenticationDefaults.AuthenticationScheme}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(CreateGymResponse))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Post([FromBody] GymDto model) {

        var response = await _mediator.Send(new CreateGymCommand { Model = model });

        return Created(string.Empty, response.Model!.Id);
    }

    [EndpointDescription("Update entity in Gym")]
    [EndpointName("UpdateGym")]
    [HttpPut]
    [Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},{ApiKeyAuthenticationDefaults.AuthenticationScheme}")]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UpdateGymResponse))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Put([FromBody] GymDto model) {

        var response = await _mediator.Send(new UpdateGymCommand() { Model = model });

        return Ok(response);
    }

    [EndpointDescription("Delete entity in Gym")]
    [EndpointName("DeleteGym")]
    [HttpDelete("{id}")]
    [Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},{ApiKeyAuthenticationDefaults.AuthenticationScheme}")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Type = typeof(DeleteGymResponse))]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] string id) {

        _ = await _mediator.Send(new DeleteGymCommand { Id = id });

        return NoContent();
    }

}
