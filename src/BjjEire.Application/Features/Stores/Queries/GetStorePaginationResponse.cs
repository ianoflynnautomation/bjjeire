

using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Stores.DTOs;

namespace BjjEire.Application.Features.Stores.Queries;

public record GetStorePaginatedResponse : PagedResponse<StoreDto>;
