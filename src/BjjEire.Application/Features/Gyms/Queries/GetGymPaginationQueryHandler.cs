using BjjEire.Application.Common;
using BjjEire.Application.Common.Interfaces;
using BjjEire.Application.Common.Models;
using BjjEire.Application.Features.Gyms.Caching;
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

        string cacheKey = GymCacheKeys.All(request.Page, request.PageSize, request.County);

        GetGymPaginationQueryHandlerLog.QueryStart(
            logger, nameof(GetGymPaginationQuery),
            request.Page, request.PageSize,
            request.County?.ToString() ?? "N/A", cacheKey);

        GetGymPaginatedResponse result = await hybridCache.GetOrCreateAsync(
            cacheKey,
            async ct =>
            {
                GetGymPaginationQueryHandlerLog.CacheMiss(logger, cacheKey);

                IQueryable<Gym> query = gymRepository.Table.Where(x => x.Status == GymStatus.Active);

                if (request.County.HasValue)
                {
                    query = query.Where(x => x.County == request.County.Value);
                }

                query = query.OrderBy(x => x.Name);

                IQueryable<GymDto> dtoQuery = query.ProjectTo<GymDto>(mapper.ConfigurationProvider);
                PaginationFilter filter = new(request.Page, request.PageSize);

                PagedResponse<GymDto> pagedData = await PaginationHelper.CreatePagedResponseAsync(
                    dtoQuery, filter,
                    GymsApiConstants.ControllerName, GymsApiConstants.GetAllActionName,
                    uriService, null, ct);

                return new GetGymPaginatedResponse { Data = pagedData.Data, Pagination = pagedData.Pagination };
            },
            tags: [GymCacheKeys.Tag],
            cancellationToken: cancellationToken);

        GetGymPaginationQueryHandlerLog.QuerySuccess(
            logger, nameof(GetGymPaginationQuery),
            result.Data.Count, result.Pagination.CurrentPage,
            result.Pagination.TotalItems, cacheKey);

        return result;
    }
}
