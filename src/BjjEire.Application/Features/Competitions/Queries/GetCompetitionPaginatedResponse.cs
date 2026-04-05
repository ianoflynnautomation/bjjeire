using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Competitions.DTOs;

namespace BjjEire.Application.Features.Competitions.Queries;

public record GetCompetitionPaginatedResponse : PagedResponse<CompetitionDto>;
