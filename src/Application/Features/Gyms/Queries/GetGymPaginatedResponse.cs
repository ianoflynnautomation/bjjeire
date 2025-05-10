
using BjjWorld.Application.Common.DTOs;
using BjjWorld.Application.Features.Gyms.DTOs;

namespace BjjWorld.Application.Features.Gyms.Queries;

public record GetGymPaginatedResponse
{
    public List<GymDto> Data { get; set; } = [];
    public PaginationMetadataDto Pagination { get; set; } = new(); 
}
