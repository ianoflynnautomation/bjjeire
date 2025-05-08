using BjjWorld.Api.Attributes;
using BjjWorld.Application.Common;
using BjjWorld.Application.Features.BjjEvents.Commands;
using BjjWorld.Application.Features.BjjEvents.DTOs;
using BjjWorld.Application.Features.BjjEvents.Queries;
using BjjWorld.Domain.Entities.BjjEvents;
using BjjWorld.Domain.Entities.Enums;

namespace BjjWorld.Api.Controllers;
public class BjjEventController(IMediator mediator) : BaseApiController
{
    private readonly IMediator _mediator = mediator;

    [EndpointDescription("Get Bjj Event entitys")]
    [EndpointName("GetAllBjjEvents")]
    [HttpGet()]
    [EnableQuery]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PaginatedBjjEventResponseDto))]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAll([FromQuery] string? city = null,[FromQuery] BjjEventType? type = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 12 )
    {
        var response = await _mediator.Send(new GetBjjEventPaginationQuery {Page = page, PageSize = pageSize, City = city, Type = type });

        return Ok(response);
    }

    [EndpointDescription("Add new entity to Bjj Event")]
    [EndpointName("InsertBjjEvent")]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    //[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GymDto))]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(BjjEventDto))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Post([FromBody] BjjEventDto model)
    {
        model = await _mediator.Send(new CreateBjjEventCommand { Model = model });

        // var location = Url.Action(nameof(Post), new { id = model.Id }) ?? $"/{model.Id}";
        // return CreatedAtAction(location, model);
        return Ok(model.Id);

    }

    [EndpointDescription("Update entity in Bjj Event")]
    [EndpointName("UpdateBjjEvent")]
    [HttpPut]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(BjjEventDto))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Put([FromBody] BjjEventDto model)
    {
        model = await _mediator.Send(new UpdateBjjEventCommand { Model = model });
        return Ok(model);
    }

    [EndpointDescription("Delete entity in Bjj Event")]
    [EndpointName("DeleteBjjEvent")]
    [HttpDelete("{key}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] string key)
    {
        var bjjEvent = await _mediator.Send(new GetGenericQuery<BjjEventDto, BjjEvent>(key));
        if (!bjjEvent.Any()) return NotFound();

#pragma warning disable CS8601 // Possible null reference assignment.
        await _mediator.Send(new DeleteBjjEventCommand { Model = bjjEvent.FirstOrDefault() });
#pragma warning restore CS8601 // Possible null reference assignment.
        return NoContent();
    }
}

