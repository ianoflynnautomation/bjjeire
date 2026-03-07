
using BjjEire.Application.Common;
using BjjEire.Domain.Enums;

namespace BjjEire.Application.Features.Gyms.Queries;

public record GetGymPaginationQuery : BasePaginationQuery, IRequest<GetGymPaginatedResponse>
{
    public County? County { get; set; }
}
