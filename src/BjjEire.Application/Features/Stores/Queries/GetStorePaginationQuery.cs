
using BjjEire.Application.Common;

namespace BjjEire.Application.Features.Stores.Queries;

public record GetStorePaginationQuery : BasePaginationQuery, IRequest<GetStorePaginatedResponse>
{

}
