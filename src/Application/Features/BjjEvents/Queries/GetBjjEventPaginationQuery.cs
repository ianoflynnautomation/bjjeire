
using BjjWorld.Application.Features.BjjEvents.DTOs;
using BjjWorld.Domain.Entities.Enums;

namespace BjjWorld.Application.Features.BjjEvents.Queries;

public record GetBjjEventPaginationQuery : IRequest<PaginatedBjjEventResponseDto>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
     public string? City { get; set; }
    public BjjEventType? Type { get; set; }
}

