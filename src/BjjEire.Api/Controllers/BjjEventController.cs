using BjjEire.Api.Attributes;
using BjjEire.Application.Common;
using BjjEire.Application.Features.BjjEvents.Commands;
using BjjEire.Application.Features.BjjEvents.DTOs;
using BjjEire.Application.Features.BjjEvents.Queries;
using BjjEire.Domain.Entities.BjjEvents;

namespace BjjEire.Api.Controllers;

public class BjjEventController(IMediator mediator) : BaseApiController {
    private readonly IMediator _mediator = mediator;

    [EndpointDescription("Get Bjj Event entitys")]
    [EndpointName("GetAllBjjEvents")]
    [HttpGet()]
    [EnableQuery]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GetBjjEventPaginatedResponse))]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAll([FromQuery] GetBjjEventPaginationQuery query) {
        var response = await _mediator.Send(query);

        return Ok(response);
    }

    [EndpointDescription("Add new entity to Bjj Event")]
    [EndpointName("InsertBjjEvent")]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(BjjEventDto))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Post([FromBody] BjjEventDto model) {
        model = await _mediator.Send(new CreateBjjEventCommand { Model = model });

        return Created(string.Empty, model);
    }

    [EndpointDescription("Update entity in Bjj Event")]
    [EndpointName("UpdateBjjEvent")]
    [HttpPut]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(BjjEventDto))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Put([FromBody] BjjEventDto model) {
        model = await _mediator.Send(new UpdateBjjEventCommand { Model = model });

        return Ok(model);
    }

    [EndpointDescription("Delete entity in Bjj Event")]
    [EndpointName("DeleteBjjEvent")]
    [HttpDelete("{key}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] string key) {
        var bjjEvent = await _mediator.Send(new GetGenericQuery<BjjEventDto, BjjEvent>(key));

        if (!bjjEvent.Any()) {
            return NotFound();
        }

        var eventToDelete = bjjEvent.First();
        _ = await _mediator.Send(new DeleteBjjEventCommand { Model = eventToDelete });
        return NoContent();
    }
}

