
using BjjEire.Application.Common.DTOs;
using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Features.BjjEvents.Queries;

public class GetBjjEventPaginatedResponseDto {
    public List<BjjEventDto> Data { get; set; } = [];
    public PaginationMetadataDto Pagination { get; set; } = new();
}
