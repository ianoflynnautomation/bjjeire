
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Gyms.DTOs;

namespace BjjEire.Application.Features.Gyms.Queries;

public record GetGymPaginatedResponse : PagedResponse<GymDto>;
