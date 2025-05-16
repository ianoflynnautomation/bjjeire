
using BjjEire.Api.Attributes;
using BjjEire.Application.Features.Gyms.Commands;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Application.Features.Gyms.Queries;

namespace BjjEire.Api.Controllers;

public class GymController(IMediator mediator) : BaseApiController {
    private readonly IMediator _mediator = mediator;

    [EndpointDescription("Get Gym entitys")]
    [EndpointName("GetAllGyms")]
    [HttpGet()]
    [EnableQuery]
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
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(GymDto))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Post([FromBody] GymDto model) {
        model = await _mediator.Send(new CreateGymCommand { Model = model });

        return Created(string.Empty, model);
    }

}
