
using BjjEire.Application.Common;

namespace BjjEire.Application.Features.Gyms.Queries;

public record GetGymPaginationQuery : BasePaginationQuery, IRequest<GetGymPaginatedResponse> {
    public string? County { get; set; }
}