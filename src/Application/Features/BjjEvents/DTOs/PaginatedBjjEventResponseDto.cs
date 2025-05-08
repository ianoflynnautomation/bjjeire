
namespace BjjWorld.Application.Features.BjjEvents.DTOs;

public class PaginatedBjjEventResponseDto
{
    public List<BjjEventDto> Data { get; set; } = [];
    public PaginationMetadataDto Pagination { get; set; } = new(); 
}
