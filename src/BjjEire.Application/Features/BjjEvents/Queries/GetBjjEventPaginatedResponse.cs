
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.BjjEvents.DTOs;

namespace BjjEire.Application.Features.BjjEvents.Queries;

public record GetBjjEventPaginatedResponse : PagedResponse<BjjEventDto>;