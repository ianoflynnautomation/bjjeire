using BjjWorld.Api.Attributes;
using BjjWorld.Application.Common;
using BjjWorld.Application.Features.GymOpenMats.Commands;
using BjjWorld.Application.Features.GymOpenMats.DTOs;
using BjjWorld.Application.Features.GymOpenMats.Queries;
using BjjWorld.Domain.Entities.Gyms;

namespace BjjWorld.Api.Controllers;

public class GymController(IMediator mediator) : BaseApiController
{
    private readonly IMediator _mediator = mediator;

    [EndpointDescription("Get entity from Gym by key")]
    [EndpointName("GetById")]
    [HttpGet("{key}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GymDto))]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] string key)
    {
        var gym = await _mediator.Send(new GetGenericQuery<GymDto, Gym>(key));
        return !gym.Any() ? NotFound() : Ok(gym.FirstOrDefault());
    }
    
    [EndpointDescription("Get entitys from Gym by city")]
    [EndpointName("GetByCity")]
    [HttpGet()]
    [EnableQuery]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PaginatedGymResponseDto))]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByCity([FromQuery] string city, [FromQuery] int page = 1, [FromQuery] int pageSize = 12 )
    {
        var response = await _mediator.Send(new GetGymsByCityPaginationQuery { City = city, Page = page, PageSize = pageSize });

        return Ok(response);
    }

    [EndpointDescription("Add new entity to gym")]
    [EndpointName("InsertGym")]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    //[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GymDto))]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(GymDto))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Post([FromBody] GymDto model)
    {
        model = await _mediator.Send(new CreateGymCommand { Model = model });

        // var location = Url.Action(nameof(Post), new { id = model.Id }) ?? $"/{model.Id}";
        // return CreatedAtAction(location, model);
        return Ok(model);
    
    }

    [EndpointDescription("Update entity in Gym")]
    [EndpointName("UpdateGym")]
    [HttpPut]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GymDto))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Put([FromBody] GymDto model)
    {
        model = await _mediator.Send(new UpdateGymCommand { Model = model });
        return Ok(model);
    }

    [EndpointDescription("Delete entity in Gym")]
    [EndpointName("DeleteGym")]
    [HttpDelete("{key}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] string key)
    {
        var gym = await _mediator.Send(new GetGenericQuery<GymDto, Gym>(key));
        if (!gym.Any()) return NotFound();

#pragma warning disable CS8601 // Possible null reference assignment.
        await _mediator.Send(new DeleteGymCommand { Model = gym.FirstOrDefault() });
#pragma warning restore CS8601 // Possible null reference assignment.
        return NoContent();
    }

}
