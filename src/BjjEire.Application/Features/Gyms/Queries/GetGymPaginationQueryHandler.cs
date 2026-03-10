using BjjEire.Application.Common;
using BjjEire.Application.Common.Constants;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Gyms.Constants;
using BjjEire.Application.Features.Gyms.DTOs;
using BjjEire.Domain.Entities.Gyms;
using BjjEire.Domain.Enums;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;

namespace BjjEire.Application.Features.Gyms.Queries;

public sealed class GetGymPaginationQueryHandler(
    IRepository<Gym> gymRepository,
    IMapper mapper,
    HybridCache hybridCache,
    IUriService uriService,
    ILogger<GetGymPaginationQueryHandler> logger)
    : IRequestHandler<GetGymPaginationQuery, GetGymPaginatedResponse>
{

    public async Task<GetGymPaginatedResponse> Handle(GetGymPaginationQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var cacheKey = CacheKey.GymsAll(request.Page, request.PageSize, request.County);

        GetGymPaginationQueryHandlerLog.QueryStart(
            logger, nameof(GetGymPaginationQuery),
            request.Page, request.PageSize,
            request.County?.ToString() ?? "N/A", cacheKey);

        var result = await hybridCache.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                GetGymPaginationQueryHandlerLog.CacheMiss(logger, cacheKey);

                var query = gymRepository.Table.Where(x => x.Status == GymStatus.Active);

                if (request.County.HasValue)
                {
                    query = query.Where(x => x.County == request.County.Value);
                }

                query = query.OrderBy(x => x.Name);

                var dtoQuery = query.ProjectTo<GymDto>(mapper.ConfigurationProvider);
                var filter = new PaginationFilter(request.Page, request.PageSize);

                var pagedData = await PaginationHelper.CreatePagedResponseAsync(
                    dtoQuery, filter,
                    GymsApiConstants.ControllerName, GymsApiConstants.GetAllActionName,
                    uriService, null, ct);

                return new GetGymPaginatedResponse { Data = pagedData.Data, Pagination = pagedData.Pagination };
            },
            tags: [CacheKey.GymsTag],
            cancellationToken: cancellationToken);

        GetGymPaginationQueryHandlerLog.QuerySuccess(
            logger, nameof(GetGymPaginationQuery),
            result.Data.Count, result.Pagination.CurrentPage,
            result.Pagination.TotalItems, cacheKey);

        return result;
    }
}
