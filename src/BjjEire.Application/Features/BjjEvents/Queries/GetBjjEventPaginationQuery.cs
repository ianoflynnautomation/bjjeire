
using BjjEire.Application.Common;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.BjjEvents.Queries;

public record GetBjjEventPaginationQuery : BasePaginationQuery, IRequest<GetBjjEventPaginatedResponse>
{
    public County? County { get; set; }
    public BjjEventType? Type { get; set; }
    public bool IncludeInactive { get; init; }
}
