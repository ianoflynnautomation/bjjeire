using BjjEire.Application.Common;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.Competitions.Queries;

public record GetCompetitionPaginationQuery : BasePaginationQuery, IRequest<GetCompetitionPaginatedResponse>
{
    public CompetitionOrganisation? Organisation { get; set; }
}
