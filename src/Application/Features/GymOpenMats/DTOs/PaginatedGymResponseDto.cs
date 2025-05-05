
namespace BjjWorld.Application.Features.GymOpenMats.DTOs;

public class PaginatedGymResponseDto
{
    public List<GymDto> Data { get; set; } = [];
    public PaginationMetadataDto Pagination { get; set; } = new(); 
}
