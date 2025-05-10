using BjjWorld.Application.Common.Constants;
using BjjWorld.Application.Common.Interfaces;
using BjjWorld.Application.Common;
using Microsoft.AspNetCore.Routing;
using BjjWorld.Application.Common.DTOs;
using BjjWorld.Domain.Entities.Gyms;
using BjjWorld.Application.Features.Gyms.DTOs;

namespace BjjWorld.Application.Features.Gyms.Queries;

public sealed class GetGymPaginationQueryHandler(IRepository<Gym> gymRepository, IMapper mapper,
ICacheBase cacheBase, ILinkService linkService)
: IRequestHandler<GetGymPaginationQuery, GetGymPaginatedResponse>
{
    private readonly IRepository<Gym> _gymRepository = gymRepository;
    private readonly IMapper _mapper = mapper;
    private readonly ICacheBase _cacheBase = cacheBase;
    private readonly ILinkService _linkService = linkService;
    private const string ControllerNameForLinks = "GetAllGyms";
    private const string ActionNameForLinks = "GetAll";

    public async Task<GetGymPaginatedResponse> Handle(GetGymPaginationQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = string.Format(CacheKey.GYM_ALL, request.Page, request.PageSize, request.City);

        return await _cacheBase.GetAsync(cacheKey, async () =>
        {
            var query = _gymRepository.Table.Where(x => x.IsActive);

            if (!string.IsNullOrWhiteSpace(request.City))
            {
                query = query.Where(x => x.City.Equals(request.City, StringComparison.CurrentCultureIgnoreCase));
            }

            query = query.OrderBy(x => x.Name);

            var pagedGymDtos = await query
                .ProjectTo<GymDto>(_mapper.ConfigurationProvider)
                .ToPagedListAsync(request.Page - 1, request.PageSize, cancellationToken);

            var additionalRouteValues = new RouteValueDictionary();
            if (!string.IsNullOrWhiteSpace(request.City))
            {
                additionalRouteValues["city"] = request.City;
            }
    

            var (nextPageUrl, previousPageUrl) = _linkService.GeneratePaginationUrls(
                controllerName: ControllerNameForLinks,
                actionName: ActionNameForLinks,
                currentPage: request.Page,
                pageSize: pagedGymDtos.PageSize,
                totalPages: pagedGymDtos.TotalPages,
                hasNextPage: pagedGymDtos.HasNextPage,
                hasPreviousPage: pagedGymDtos.HasPreviousPage,
                additionalRouteValues: additionalRouteValues
            );

            return new GetGymPaginatedResponse
            {
                Data = [.. pagedGymDtos],
                Pagination = new PaginationMetadataDto
                {
                    TotalItems = pagedGymDtos.TotalCount,
                    CurrentPage = request.Page,
                    PageSize = pagedGymDtos.PageSize,
                    TotalPages = pagedGymDtos.TotalPages,
                    HasNextPage = pagedGymDtos.HasNextPage,
                    HasPreviousPage = pagedGymDtos.HasPreviousPage,
                    NextPageUrl = nextPageUrl,
                    PreviousPageUrl = previousPageUrl
                }
            };

        });
    }
}