
using BjjWorld.Application.Features.GymOpenMats.DTOs;
using BjjWorld.Domain.Entities;

namespace BjjWorld.Application.Features.GymOpenMats.Queries;

public record GetGymsByCityPaginationQuery : IRequest<PaginatedGymResponseDto>
{
    public required string City { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

