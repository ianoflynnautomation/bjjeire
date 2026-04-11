using BjjEire.Application.Common;

namespace BjjEire.Application.Features.Competitions.Queries;

public record GetCompetitionPaginationQuery : BasePaginationQuery, IRequest<GetCompetitionPaginatedResponse>
{
    public bool IncludeInactive { get; init; }
}
