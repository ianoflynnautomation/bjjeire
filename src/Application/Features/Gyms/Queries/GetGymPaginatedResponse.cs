
using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Features.Gyms.Queries;

public record GetGymPaginatedResponse
{
    public List<GymDto> Data { get; set; } = [];
    public PaginationMetadataDto Pagination { get; set; } = new(); 
}
