using BjjEire.Application.Common;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Competitions.DTOs;

namespace BjjEire.Application.Features.Competitions.Queries;

public record GetCompetitionPaginationQuery : BasePaginationQuery, IRequest<PagedResponse<CompetitionDto>>
{
    public bool IncludeInactive { get; init; }
}
