// using BjjWorld.Application.Common;
// using BjjWorld.Application.Features.GymOpenMats.Commands;
// using BjjWorld.Application.Features.GymOpenMats.DTOs;
// using BjjWorld.Application.Features.GymOpenMats.Queries;
// using BjjWorld.Domain.Entities;
// using BjjWorld.Domain.Entities.Gyms;
// using Microsoft.AspNetCore.Http.HttpResults;

// namespace BjjWorld.Web.Endpoints;

// public class Gyms : EndpointGroupBase
// {
//     public override void Map(WebApplication app)
//     {
//         app.MapGroup(this)
//             //.RequireAuthorization()
//             .MapGet(GetById, "{key}")
//             .MapGet(GetByCity, "city/{city}")
//             .MapGet(GetByCityPagination, "citys/{city}")
//             .MapPost(CreateGym);
//     }

//       private async Task<IResult> GetById(string key, IMediator mediator)
//     {
//         var gym = await mediator.Send(new GetGenericQuery<GymDto, Gym>(key));
//         return TypedResults.Ok(gym);
//     }

//     public async Task<Ok<IPagedList<GymDto>>> GetByCityPagination(IMediator mediator, [AsParameters] GetGymsByCityPaginationQuery query)
//     {
//         var gyms = await mediator.Send(query);
//          return TypedResults.Ok(gyms);
//     }

//     private async Task<Ok<IList<GymDto>>> GetByCity(string city, IMediator mediator)
//     {
//          var gyms = await mediator.Send(new GetGymsByCityQuery { City = city });
//          return TypedResults.Ok(gyms);
//     }

//     public async Task<Created<GymDto>> CreateGym(IMediator mediator, GymDto model)
//     {
//         var createdGym = await mediator.Send(new CreateGymCommand { Model = model });
//         return TypedResults.Created($"/{nameof(GetById)}/{createdGym.Id}", createdGym);
//     }

// }
