
using BjjWorld.Application.Common.DTOs;
using BjjWorld.Application.Features.BjjEvents.DTOs;

namespace BjjWorld.Application.Features.BjjEvents.Queries;

public class GetBjjEventPaginatedResponseDto
{
    public List<BjjEventDto> Data { get; set; } = [];
    public PaginationMetadataDto Pagination { get; set; } = new(); 
}
